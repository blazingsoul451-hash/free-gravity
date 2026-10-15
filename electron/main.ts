import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
const SERVER_PORT = 4000;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/* -------------------------------------------------------------------------- */
/* Local Server Process Supervisor                                            */
/* -------------------------------------------------------------------------- */

function startBackendServer(): Promise<boolean> {
  return new Promise((resolve) => {
    // First, check if server is already running on port 4000
    const checkReq = http.get(`http://localhost:${SERVER_PORT}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`[Electron Supervisor] Server is already running on port ${SERVER_PORT}`);
        resolve(true);
      }
    });

    checkReq.on('error', () => {
      console.log(`[Electron Supervisor] Spawning local backend server (server/index.ts)...`);

      const serverScriptPath = isDev
        ? path.join(__dirname, '../server/index.ts')
        : path.join(__dirname, '../server/index.js');

      try {
        // Spawn with tsx in dev or node in production
        const executable = isDev ? (process.platform === 'win32' ? 'npx.cmd' : 'npx') : 'node';
        const args = isDev ? ['tsx', serverScriptPath] : [serverScriptPath];

        serverProcess = spawn(executable, args, {
          cwd: path.join(__dirname, '..'),
          env: {
            ...process.env,
            PORT: String(SERVER_PORT),
            NODE_ENV: isDev ? 'development' : 'production',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        serverProcess.stdout?.on('data', (data) => {
          console.log(`[Server stdout]: ${data.toString().trim()}`);
        });

        serverProcess.stderr?.on('data', (data) => {
          console.error(`[Server stderr]: ${data.toString().trim()}`);
        });

        serverProcess.on('error', (err) => {
          console.error('[Electron Supervisor] Failed to spawn backend server:', err);
          resolve(false);
        });

        serverProcess.on('exit', (code, signal) => {
          console.log(`[Electron Supervisor] Server exited with code ${code}, signal ${signal}`);
          serverProcess = null;
        });

        // Give server 1.5s to bind to port
        setTimeout(() => resolve(true), 1500);
      } catch (err) {
        console.error('[Electron Supervisor] Error launching server process:', err);
        resolve(false);
      }
    });

    checkReq.setTimeout(1000, () => {
      checkReq.destroy();
    });
  });
}

function stopBackendServer() {
  if (serverProcess) {
    console.log('[Electron Supervisor] Stopping backend server...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
    } else {
      serverProcess.kill('SIGTERM');
    }
    serverProcess = null;
  }
}

/* -------------------------------------------------------------------------- */
/* BrowserWindow Creation & Titlebar Setup                                    */
/* -------------------------------------------------------------------------- */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#090a0f', // Deep obsidian surface base
    show: false, // Show once ready-to-show to prevent white flash
    title: 'Free Gravity — Open Agentic Studio',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    ...(process.platform !== 'darwin' && {
      titleBarOverlay: {
        color: '#090a0f',
        symbolColor: '#94a3b8',
        height: 38,
      },
    }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load Vite Dev Server in development or built HTML in production
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/* -------------------------------------------------------------------------- */
/* IPC Handlers                                                               */
/* -------------------------------------------------------------------------- */

function setupIpcHandlers() {
  // Window Control Handlers
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Native Native File & Directory Dialogs
  ipcMain.handle('dialog:openDirectory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Workspace Directory',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:openFile', async (_, options) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // System Info & Hardware Metrics
  ipcMain.handle('system:getMetrics', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      osType: os.type(),
      osRelease: os.release(),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
      uptime: os.uptime(),
    };
  });

  // External URL Opener
  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      await shell.openExternal(url);
    }
  });

  // Local Backend Server Health & Restart
  ipcMain.handle('server:getStatus', () => {
    return {
      running: serverProcess !== null || true,
      port: SERVER_PORT,
      pid: serverProcess?.pid || null,
    };
  });

  ipcMain.handle('server:restart', async () => {
    stopBackendServer();
    const ok = await startBackendServer();
    return { ok };
  });
}

/* -------------------------------------------------------------------------- */
/* App Lifecycle Management                                                   */
/* -------------------------------------------------------------------------- */

app.whenReady().then(async () => {
  setupIpcHandlers();
  await startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});

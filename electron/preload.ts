import { contextBridge, ipcRenderer } from 'electron';

/**
 * Free Gravity Context-Isolated Electron Preload Script.
 * Securely exposes native desktop capabilities to the Studio frontend.
 */

export interface FreeGravityElectronAPI {
  platform: NodeJS.Platform;
  arch: string;
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  dialog: {
    openDirectory: () => Promise<string | null>;
    openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
  };
  system: {
    getMetrics: () => Promise<{
      platform: string;
      arch: string;
      osType: string;
      osRelease: string;
      cpuCount: number;
      cpuModel: string;
      freeMem: number;
      totalMem: number;
      uptime: number;
    }>;
    openExternal: (url: string) => Promise<void>;
  };
  server: {
    getStatus: () => Promise<{
      running: boolean;
      port: number;
      pid: number | null;
    }>;
    restart: () => Promise<{ ok: boolean }>;
  };
}

const api: FreeGravityElectronAPI = {
  platform: process.platform,
  arch: process.arch,

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  },

  system: {
    getMetrics: () => ipcRenderer.invoke('system:getMetrics'),
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },

  server: {
    getStatus: () => ipcRenderer.invoke('server:getStatus'),
    restart: () => ipcRenderer.invoke('server:restart'),
  },
};

// Expose strictly via contextBridge
contextBridge.exposeInMainWorld('freeGravity', api);

// Global TypeScript declaration for window
declare global {
  interface Window {
    freeGravity?: FreeGravityElectronAPI;
  }
}

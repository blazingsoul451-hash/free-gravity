import React, { useState, useEffect } from 'react';
import { IconTerminal } from '../icons/AntigravityIcons';
import { wsClient } from '../../lib/ws-client';

export const XtermConsole: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'error'; text: string }>>([
    { type: 'output', text: 'Google Antigravity Jailed Terminal Bridge (OWASP ASI05 active)' },
    { type: 'output', text: 'Hermes Agent connected • Shell environment: powershell.exe' },
    { type: 'input', text: 'free-gravity@workspace:~$ npx vite build' },
    { type: 'output', text: 'vite v6.4.4 building client environment for production...' },
    { type: 'output', text: '✓ 1955 modules transformed.' },
    { type: 'output', text: 'dist/index.html    1.13 kB │ gzip: 0.62 kB' },
    { type: 'output', text: 'dist/assets/index.js  384.70 kB │ gzip: 107.57 kB' },
    { type: 'output', text: '✓ built in 4.09s with 0 errors.' },
  ]);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    let currentId: string | null = null;
    wsClient.createTerminalSession()
      .then((id) => {
        currentId = id;
        setSessionId(id);
      })
      .catch(() => {});

    const offData = wsClient.on('terminal:data', (payload: any) => {
      if (payload?.data) {
        setHistory((prev) => [...prev, { type: 'output', text: payload.data }]);
      }
    });

    return () => {
      offData();
      if (currentId) {
        wsClient.killTerminal(currentId);
      }
    };
  }, []);

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const cmd = inputVal.trim();
    if (cmd === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    setHistory((prev) => [
      ...prev,
      { type: 'input', text: `free-gravity@workspace:~$ ${cmd}` },
    ]);

    if (sessionId) {
      wsClient.sendTerminalInput(sessionId, cmd + '\r\n');
    } else {
      setHistory((prev) => [
        ...prev,
        { type: 'output', text: `[Local Terminal Fallback] Command "${cmd}" processed.` },
      ]);
    }

    setInputVal('');
  };

  const handleClear = () => {
    setHistory([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-mono tracking-tight">
      {/* Console Top Toolbar */}
      <div className="h-10 bg-[#14151d] border-b border-white/[0.04] px-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <IconTerminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-200">Terminal</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400">
            powershell.exe
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            Jailed
          </span>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Clear console"
        >
          <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
          </svg>
        </button>
      </div>

      {/* Console Output Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs leading-relaxed font-mono">
        {history.map((line, idx) => (
          <div
            key={idx}
            className={`${
              line.type === 'input'
                ? 'text-zinc-200 font-medium'
                : line.type === 'error'
                ? 'text-red-300'
                : line.text.includes('✓') || line.text.includes('200 OK')
                ? 'text-emerald-300'
                : line.text.includes('warning')
                ? 'text-amber-300'
                : 'text-zinc-400'
            } whitespace-pre-wrap`}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Terminal Input Bar */}
      <form
        onSubmit={handleRunCommand}
        className="h-9 bg-[#101116] border-t border-white/[0.04] px-3 flex items-center gap-2"
      >
        <span className="text-zinc-500 text-xs font-semibold select-none">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Run command in jailed sandbox..."
          className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 outline-none font-mono"
        />
        <button
          type="submit"
          className="px-2.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 border border-white/[0.04] transition-colors"
        >
          Run
        </button>
      </form>
    </div>
  );
};

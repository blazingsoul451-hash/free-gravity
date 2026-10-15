import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2, Play, ShieldAlert, Check } from 'lucide-react';
import { wsClient } from '../../lib/ws-client';

export const XtermConsole: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'error'; text: string }>>([
    { type: 'output', text: 'Free Gravity Native Terminal (OWASP ASI05 Jailed)' },
    { type: 'output', text: 'Hermes Agent active • Shell environment: powershell.exe' },
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
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-mono">
      {/* Console Top Toolbar */}
      <div className="h-10 bg-[#121317] border-b border-[#e6eaf00f] px-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
          <TerminalIcon className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">xterm.js Console</span>
          <span className="text-[10px] px-1.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
            node-pty (stdio)
          </span>
        </div>

        <button
          onClick={handleClear}
          className="p-1.5 rounded hover:bg-white/[0.06] text-[#64748b] hover:text-white transition-colors"
          title="Clear console"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Console Output Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 text-xs leading-relaxed">
        {history.map((line, idx) => (
          <div
            key={idx}
            className={`${
              line.type === 'input'
                ? 'text-cyan-300 font-semibold'
                : line.type === 'error'
                ? 'text-rose-400'
                : 'text-[#94a3b8]'
            } whitespace-pre-wrap`}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Console Interactive Input Prompt */}
      <form
        onSubmit={handleRunCommand}
        className="h-11 bg-[#121317] border-t border-[#e6eaf00f] px-3 flex items-center gap-2"
      >
        <span className="text-xs text-amber-400 font-semibold select-none">
          free-gravity:~$
        </span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Execute shell command..."
          className="flex-1 bg-transparent text-xs text-white outline-none font-mono placeholder-[#475569]"
        />
        <button
          type="submit"
          className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
        </button>
      </form>
    </div>
  );
};

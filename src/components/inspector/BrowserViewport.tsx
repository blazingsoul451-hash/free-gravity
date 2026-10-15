import React, { useState, useEffect } from 'react';
import { IconSslLock } from '../icons/AntigravityIcons';
import { wsClient, BrowserFramePayload } from '../../lib/ws-client';

interface BrowserViewportProps {
  initialUrl?: string;
  isHeadful?: boolean;
  onToggleHeadful?: () => void;
}

export const BrowserViewport: React.FC<BrowserViewportProps> = ({
  initialUrl = 'http://localhost:5173',
  isHeadful = false,
  onToggleHeadful,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [frameImage, setFrameImage] = useState<string | null>(null);
  const [actionLogs, setActionLogs] = useState<Array<{ time: string; event: string }>>([]);

  useEffect(() => {
    wsClient.startBrowserScreencast();

    const offFrame = wsClient.on<BrowserFramePayload>('browser:frame', (payload) => {
      if (payload?.data) {
        setFrameImage(`data:image/jpeg;base64,${payload.data}`);
      }
    });

    const offTimeline = wsClient.on('browser:timeline_update', (action: any) => {
      if (action) {
        setActionLogs((prev) => [
          { time: new Date().toLocaleTimeString(), event: `${action.action || 'action'} ${action.url || action.target || ''}` },
          ...prev,
        ]);
      }
    });

    return () => {
      offFrame();
      offTimeline();
    };
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    wsClient.executeBrowserAction('navigate', { url }).catch(() => {});
    setTimeout(() => {
      setIsLoading(false);
      setActionLogs((prev) => [
        { time: new Date().toLocaleTimeString(), event: `Navigated to ${url}` },
        ...prev,
      ]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRefresh();
    }
  };

  const handleTakeoverClick = () => {
    if (!isHeadful) {
      wsClient.triggerBrowserTakeover().catch(() => {});
    } else {
      wsClient.resumeBrowserControl().catch(() => {});
    }
    onToggleHeadful?.();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-sans tracking-tight">
      
      {/* Browser Navigation Bar */}
      <div className="h-10 bg-[#14151d] border-b border-white/[0.04] px-2.5 flex items-center gap-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-0.5">
          <button 
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
            title="Back"
          >
            <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M400-240 160-480l241-241 56 57-144 144h487v80H313l144 143-57 57Z"/>
            </svg>
          </button>
          <button 
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
            title="Forward"
          >
            <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
              <path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className={`w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors ${
              isLoading ? 'animate-spin text-zinc-200' : ''
            }`}
            title="Reload page"
          >
            <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/>
            </svg>
          </button>
        </div>

        {/* URL Pill Container */}
        <div className="h-6.5 flex-1 rounded-md bg-[#090a0f] border border-white/[0.04] px-2.5 flex items-center gap-1.5 focus-within:border-white/[0.08]">
          <IconSslLock className="w-3 h-3 text-emerald-400/80 flex-shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-[11px] font-mono text-zinc-200 outline-none"
            placeholder="http://localhost:5173"
          />
          <span className="text-[9px] font-mono px-1 rounded bg-white/[0.04] text-zinc-500">
            CDP
          </span>
        </div>

        {/* Headful Human Takeover Toggle */}
        <button
          type="button"
          onClick={handleTakeoverClick}
          className={`h-6.5 px-2 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
            isHeadful
              ? 'bg-red-950/20 text-red-300 border-red-800/20'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.04]'
          }`}
          title="Toggle between autonomous agent CDP screencast and interactive takeover"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isHeadful ? 'bg-red-400 animate-pulse' : 'bg-emerald-400/80'}`} />
          <span>{isHeadful ? 'Release' : 'Takeover'}</span>
        </button>
      </div>

      {/* Live Canvas Frame Container */}
      <div className="flex-1 bg-[#090a0f] relative overflow-hidden flex flex-col justify-between">
        
        <div className="flex-1 overflow-auto flex items-center justify-center p-3">
          {frameImage ? (
            <div className="relative border border-white/[0.04] rounded-lg overflow-hidden shadow-sm max-w-full">
              <img
                src={frameImage}
                alt="Playwright CDP Screencast"
                className="max-h-[60vh] w-auto object-contain"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#090a0f]/90 text-[10px] font-mono text-emerald-300 border border-white/[0.04]">
                LIVE CDP 1280x800
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[300px] border border-white/[0.04] rounded-lg overflow-hidden bg-[#101116] flex flex-col">
              <div className="p-2 border-b border-white/[0.04] bg-[#14151d] flex items-center justify-between text-xs text-zinc-400">
                <span>Viewport Preview</span>
                <span className="font-mono text-[10px] text-zinc-500">PORT 5173 READY</span>
              </div>
              <iframe
                src={url}
                title="Live Viewport"
                className="flex-1 w-full border-none bg-white"
              />
            </div>
          )}
        </div>

        {/* CDP Action Timeline Log */}
        <div className="h-28 bg-[#101116] border-t border-white/[0.04] p-2 flex flex-col select-none">
          <div className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Playwright CDP Event Log</span>
            <span className="text-zinc-500">OWASP ASI05 Jailed</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5 font-mono text-[11px]">
            {actionLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-400">
                <span className="text-zinc-600 text-[10px]">{log.time}</span>
                <span className="text-zinc-600">&bull;</span>
                <span className="truncate">{log.event}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

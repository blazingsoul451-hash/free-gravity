import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Lock, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  Eye, 
  MousePointer, 
  Camera, 
  ShieldCheck, 
  Sliders,
  CheckCircle2,
  Play
} from 'lucide-react';
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
  const [actionLogs, setActionLogs] = useState([
    { time: '15:42:11', event: 'Launched Playwright Chromium (CDP port 9222)' },
    { time: '15:42:12', event: 'Navigated to http://localhost:5173 (200 OK, 142ms)' },
    { time: '15:42:13', event: 'Extracted 14 DOM elements and 2 buttons' },
    { time: '15:42:14', event: 'Captured screencast viewport frame (1280x800)' },
  ]);

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
    }, 600);
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
    <div className="flex-1 flex flex-col h-full bg-[#0d0e14] overflow-hidden select-none">
      
      {/* Chrome-Style Navigation Header */}
      <div className="p-2.5 bg-[#121317] border-b border-[#e6eaf00f] flex items-center gap-2">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-white/[0.06] text-[#64748b] hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-white/[0.06] text-[#64748b] hover:text-white transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRefresh}
            className={`p-1 rounded hover:bg-white/[0.06] text-[#64748b] hover:text-white transition-colors ${
              isLoading ? 'animate-spin text-cyan-400' : ''
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-[#18191d] border border-white/10 rounded-full text-xs text-white">
          <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent text-xs font-mono outline-none text-[#e2e8f0]"
          />
          <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 rounded border border-cyan-500/30 font-mono">
            LIVE CDP
          </span>
        </div>

        {/* Headful / Take Over Manually Button */}
        <button
          onClick={handleTakeoverClick}
          title={isHeadful ? 'Switch to Background Headless' : 'Take Over Manually (Show Window)'}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
            isHeadful
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-white/[0.06] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white border-white/10'
          }`}
        >
          <ExternalLink className="w-3 h-3" />
          <span className="text-[11px]">{isHeadful ? 'Manual (Headful)' : 'Take Over'}</span>
        </button>
      </div>

      {/* Main Viewport: Screencast Simulation */}
      <div className="flex-1 relative bg-[#090a0f] overflow-hidden flex flex-col items-center justify-center p-4">
        {/* Browser canvas frame */}
        <div className="w-full h-full max-w-4xl bg-[#121317] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative group">
          {frameImage ? (
            <div className="w-full h-full flex items-center justify-center bg-black relative">
              <img src={frameImage} alt="CDP Screencast Stream" className="max-w-full max-h-full object-contain select-none" />
            </div>
          ) : (
          /* Simulated Browser Webpage Content */
          <div className="flex-1 bg-gradient-to-br from-[#090a0f] via-[#121317] to-[#18191d] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl translate-x-20 pointer-events-none" />

            {/* Simulated Live Cursor for Hermes Agent */}
            <div className="absolute top-1/3 left-1/2 -translate-x-12 -translate-y-8 flex items-center gap-2 pointer-events-none animate-bounce">
              <MousePointer className="w-5 h-5 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/50 text-[10px] font-mono text-cyan-300 shadow-lg">
                Hermes Agent (Clicking #cta-btn)
              </span>
            </div>

            <div className="relative z-10 max-w-md space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-xs text-violet-300 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Playwright Live Automation Stream</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Free Gravity Local Testbed
              </h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Inspecting DOM tree elements, verifying responsive layout, and running continuous end-to-end user journeys.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <div id="cta-btn" className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-xs font-semibold text-white shadow-lg">
                  Automated CTA Button
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-[#cbd5e1]">
                  200 OK Response
                </div>
              </div>
            </div>

            {/* Bottom Floating Stats */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-[#64748b] font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.04]">
              <span>CDP Screencast: 30 FPS • 1280x800</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero Latency Local Bridge</span>
              </span>
            </div>
          </div>
          )}

        </div>
      </div>

      {/* Step-by-Step Action Log Timeline */}
      <div className="h-32 bg-[#121317] border-t border-[#e6eaf00f] flex flex-col">
        <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3 h-3 text-cyan-400" />
            <span>Browser Action Timeline</span>
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">
            {actionLogs.length} Events Logged
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]">
          {actionLogs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-[#94a3b8]">
              <span className="text-[#64748b]">{log.time}</span>
              <span className="text-cyan-400">›</span>
              <span className="text-white truncate">{log.event}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

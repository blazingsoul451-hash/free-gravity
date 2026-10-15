import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Check, 
  Copy 
} from 'lucide-react';
import { OsDownloadButton } from './OsDetector';

interface TypewriterHeroProps {
  onWatchVideo?: () => void;
  className?: string;
}

const HERO_PHRASES = [
  "Local-First Autonomous Coding Studio",
  "Zero Cloud Lock-in • Powered by Hermes 3",
  "Full IDE, Browser & Terminal Multi-Pane",
  "100% Free Google Antigravity Alternative"
];

export const TypewriterHero: React.FC<TypewriterHeroProps> = ({ 
  onWatchVideo,
  className = '' 
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedNpx, setCopiedNpx] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);

  // Typewriter Loop
  useEffect(() => {
    const currentFullText = HERO_PHRASES[phraseIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayText.length < currentFullText.length) {
        // Natural human typing cadence (35ms - 85ms)
        const delay = Math.floor(Math.random() * 45) + 35;
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, delay);
      } else {
        // Hold phrase at completion
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2800);
      }
    } else {
      if (displayText.length > 0) {
        // Deleting speed is faster
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length - 1));
        }, 25);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  // Dynamically update CSS custom properties --cursor-pos-x and --cursor-pos-y
  useEffect(() => {
    if (!containerRef.current || !activeCharRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const charRect = activeCharRef.current.getBoundingClientRect();

    const posX = charRect.right - containerRect.left + 2;
    const posY = charRect.top - containerRect.top;

    containerRef.current.style.setProperty('--cursor-pos-x', `${posX}px`);
    containerRef.current.style.setProperty('--cursor-pos-y', `${posY}px`);
  }, [displayText]);

  const handleCopyNpx = () => {
    navigator.clipboard.writeText('npx free-gravity-cli');
    setCopiedNpx(true);
    setTimeout(() => setCopiedNpx(false), 2000);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative z-10 flex flex-col items-center text-center px-4 pt-8 pb-16 md:pt-16 md:pb-24 max-w-5xl mx-auto ${className}`}
    >
      {/* Top Release Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18191d]/90 border border-white/10 backdrop-blur-md mb-8 shadow-inner shadow-white/5 hover:border-violet-500/40 transition-colors cursor-default">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="text-xs font-mono font-medium text-slate-300 tracking-wide">
          Free Gravity v1.0 <span className="text-violet-400 font-semibold">• Open Alternative</span>
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
          Local First
        </span>
      </div>

      {/* Main Google Antigravity Replica Typewriter Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.12] min-h-[140px] sm:min-h-[170px] lg:min-h-[190px] flex flex-col items-center justify-center">
        <span className="text-slate-400 font-light block text-2xl sm:text-3xl lg:text-4xl mb-2">
          Unleash the Agentic Future with
        </span>
        
        {/* Typewriter text with SplitText character styling */}
        <span className="relative inline-block font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          {displayText.split('').map((char, index) => {
            const isLast = index === displayText.length - 1;
            return (
              <span
                key={index}
                ref={isLast ? activeCharRef : null}
                className="inline-block transition-all duration-75"
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
          
          {/* Authentic Blinking Cursor */}
          <span
            className="inline-block w-[3px] sm:w-[4px] h-[0.9em] ml-1 align-middle bg-gradient-to-b from-cyan-400 via-violet-400 to-indigo-500 rounded-sm animate-[pulse_1s_infinite] shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            aria-hidden="true"
          />
        </span>
      </h1>

      {/* Hero Subhead */}
      <p className="max-w-2xl text-base sm:text-lg lg:text-xl text-slate-400 font-normal leading-relaxed mb-10">
        The 100% open-source, local-first workspace for autonomous software engineering. 
        Execute subagents across <span className="text-slate-200 font-medium">multi-pane IDE, headless browser, and terminals</span> with 
        Hermes 3 or Ollama on your own GPU.
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
        {/* Launch Web Studio Button */}
        <a
          href="/app"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-base shadow-xl shadow-violet-950/50 hover:shadow-cyan-900/40 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group"
        >
          <span>Launch Web Studio</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Dynamic OS-Aware Download Dropdown */}
        <OsDownloadButton />
      </div>

      {/* Secondary Quick Action Bar: Video Trigger + Terminal Quick Start */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
        {onWatchVideo && (
          <button
            onClick={onWatchVideo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#18191d]/80 hover:bg-[#212226] border border-white/5 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <span className="p-1 rounded-full bg-violet-600/30 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Play className="w-3 h-3 fill-current" />
            </span>
            <span>Watch Studio Demo (1:30)</span>
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d0e14] border border-white/10 text-slate-300 shadow-inner">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">CLI:</span>
          <code className="text-cyan-300 font-mono font-medium">npx free-gravity-cli</code>
          <button
            onClick={handleCopyNpx}
            title="Copy command"
            className="p-1 hover:text-white transition-colors cursor-pointer"
          >
            {copiedNpx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-14 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-400 text-xs w-full max-w-4xl">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Telemetry / Air-Gapped</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Ollama & Hermes 3 Ready</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span>Full 4-Pillars Architecture</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>100% Free Forever (MIT)</span>
        </div>
      </div>
    </div>
  );
};

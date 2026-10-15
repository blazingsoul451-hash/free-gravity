import React, { useState, useEffect, useRef } from 'react';
import { OsDownloadButton } from './OsDetector';

interface TypewriterHeroProps {
  onWatchVideo?: () => void;
  className?: string;
}

const HERO_PHRASES = [
  "Experience liftoff with the next-gen agent platform",
  "Built for developers for the agent-first era",
  "Autonomous Browser, Monaco IDE & Terminal Studio",
  "100% Free Open Alternative • Powered by Hermes 3"
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
        const delay = Math.floor(Math.random() * 35) + 30;
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, delay);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2500);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length - 1));
        }, 20);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  const handleCopyNpx = () => {
    navigator.clipboard.writeText('npx free-gravity-cli');
    setCopiedNpx(true);
    setTimeout(() => setCopiedNpx(false), 2000);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative z-10 flex flex-col items-center text-center px-4 pt-8 pb-16 md:pt-16 md:pb-24 max-w-5xl mx-auto font-sans ${className}`}
    >
      {/* Top Announcement Pill - Scraped Spec from AnnouncementPill.AGG_9Wye.css */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1f20] border border-[#444746] mb-8 select-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a8c7fa] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a8c7fa]"></span>
        </span>
        <span className="text-xs font-medium text-[#c4c7c5]">
          Google Antigravity 2.0 <span className="text-[#a8c7fa] font-semibold">&bull; Free Open Replication</span>
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#004a77] text-[#c2e7ff] border border-[#004a77]">
          Local First
        </span>
      </div>

      {/* Main Replica Typewriter Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#e3e3e3] mb-6 leading-[1.15] min-h-[140px] sm:min-h-[170px] lg:min-h-[190px] flex flex-col items-center justify-center">
        <span className="text-[#8e918f] font-normal block text-2xl sm:text-3xl lg:text-4xl mb-2">
          Experience liftoff with
        </span>
        
        {/* Typewriter text */}
        <span className="relative inline-block font-extrabold text-[#e3e3e3]">
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
            className="inline-block w-[3px] sm:w-[4px] h-[0.9em] ml-1 align-middle bg-[#a8c7fa] rounded-sm animate-[pulse_1s_infinite] shadow-[0_0_12px_rgba(168,199,250,0.8)]"
            aria-hidden="true"
          />
        </span>
      </h1>

      {/* Hero Subhead */}
      <p className="max-w-2xl text-base sm:text-lg text-[#8e918f] font-normal leading-relaxed mb-10">
        Built for developers for the agent-first era. Execute autonomous subagents across{' '}
        <span className="text-[#e3e3e3] font-medium">multi-pane Studio, Playwright browser, Monaco IDE, and jailed terminals</span>{' '}
        with Hermes 3 or Ollama on your own machine.
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10 select-none">
        {/* Launch Web Studio Button */}
        <a
          href="/app"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-sm shadow-lg transition-all cursor-pointer group"
        >
          <span>Launch Web Studio</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </a>

        {/* Dynamic OS-Aware Download Dropdown */}
        <OsDownloadButton />
      </div>

      {/* Secondary Quick Action Bar: Video Trigger + Terminal Quick Start */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[#8e918f] select-none">
        {onWatchVideo && (
          <button
            type="button"
            onClick={onWatchVideo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#444746] text-[#c4c7c5] hover:text-[#e3e3e3] transition-colors cursor-pointer"
          >
            <span className="w-5 h-5 rounded-full bg-[#004a77] text-[#c2e7ff] flex items-center justify-center text-[10px]">
              ▶
            </span>
            <span>Watch Studio Demo (1:30)</span>
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e1f20] border border-[#444746] text-[#c4c7c5]">
          <span className="text-[#fcbd00] font-mono">&gt;_</span>
          <span className="text-[#8e918f]">CLI:</span>
          <code className="text-[#a8c7fa] font-mono font-medium">npx free-gravity-cli</code>
          <button
            type="button"
            onClick={handleCopyNpx}
            className="p-1 rounded hover:bg-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3] transition-colors cursor-pointer"
            title="Copy command"
          >
            {copiedNpx ? <span className="text-[#80da88]">✓</span> : <span>Copy</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

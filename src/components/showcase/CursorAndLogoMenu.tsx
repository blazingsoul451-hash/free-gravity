import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Copy, 
  Download, 
  Code2, 
  Palette, 
  Sparkles, 
  Check, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. Free Gravity Iconic SVG Vector Asset                                     */
/* -------------------------------------------------------------------------- */

export const FREE_GRAVITY_LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fg-glow" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7c3aed"/>
      <stop offset="0.5" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="fg-core" x1="18" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff"/>
      <stop offset="1" stop-color="#94a3b8"/>
    </linearGradient>
    <filter id="fg-blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <!-- Outer Anti-Gravity Levitating Ring -->
  <circle cx="18" cy="18" r="16" stroke="url(#fg-glow)" stroke-width="1.8" stroke-dasharray="8 4" opacity="0.85" filter="url(#fg-blur)"/>
  <!-- Central Inverted Gravitational Prism -->
  <path d="M18 7L28 25H8L18 7Z" fill="url(#fg-glow)" fill-opacity="0.2" stroke="url(#fg-glow)" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- Core Zero-G Singularity -->
  <polygon points="18,12 24,23 12,23" fill="url(#fg-core)"/>
  <circle cx="18" cy="18" r="2.5" fill="#06b6d4"/>
</svg>`;

export const FreeGravityLogo: React.FC<{
  size?: number;
  className?: string;
  showText?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
}> = ({ size = 32, className = '', showText = true, onContextMenu }) => {
  return (
    <div
      onContextMenu={onContextMenu}
      className={`inline-flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
      title="Right-click for Secret Logo Context Menu"
    >
      <div 
        className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 36 36" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500 group-hover:rotate-6"
        >
          <defs>
            <linearGradient id="fg-logo-glow" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7c3aed"/>
              <stop offset="0.5" stopColor="#6366f1"/>
              <stop offset="1" stopColor="#06b6d4"/>
            </linearGradient>
            <linearGradient id="fg-logo-core" x1="18" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff"/>
              <stop offset="1" stopColor="#94a3b8"/>
            </linearGradient>
          </defs>
          <circle 
            cx="18" 
            cy="18" 
            r="16" 
            stroke="url(#fg-logo-glow)" 
            strokeWidth="1.8" 
            strokeDasharray="8 4" 
            className="animate-[spin_24s_linear_infinite]"
          />
          <path 
            d="M18 7L28 25H8L18 7Z" 
            fill="url(#fg-logo-glow)" 
            fillOpacity="0.25" 
            stroke="url(#fg-logo-glow)" 
            strokeWidth="1.5" 
            strokeLinejoin="round"
          />
          <polygon points="18,12 24,23 12,23" fill="url(#fg-logo-core)" />
          <circle cx="18" cy="18" r="2.5" fill="#06b6d4" className="animate-pulse" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold tracking-tight text-white text-base leading-none group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
            Free Gravity
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
              Open
            </span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider">
            LOCAL-FIRST STUDIO
          </span>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Hardware Velocity Cursor Tracker                                        */
/* -------------------------------------------------------------------------- */

export const HardwareVelocityCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 });
  const [velocity, setVelocity] = useState({ vx: 0, vy: 0, speed: 0, angle: 0 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);

  const posRef = useRef({ x: -100, y: -100 });
  const lastPosRef = useRef({ x: -100, y: -100 });
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Only enable for fine pointer devices (desktops/laptops, not touchscreens)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) return;
    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });

      // Check if hovering interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest('a') ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer')
        );
        setIsHoveringInteractive(interactive);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Smooth physics trailing animation loop
    const render = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);

      const dx = posRef.current.x - lastPosRef.current.x;
      const dy = posRef.current.y - lastPosRef.current.y;

      const vx = dx / (dt / 16.6);
      const vy = dy / (dt / 16.6);
      const speed = Math.sqrt(vx * vx + vy * vy);
      const angle = Math.atan2(vy, vx);

      setVelocity({ vx, vy, speed: Math.min(speed, 45), angle });

      lastPosRef.current = { ...posRef.current };
      lastTimeRef.current = now;

      // Trailing spring lerp
      setTrailingPos((prev) => ({
        x: prev.x + (posRef.current.x - prev.x) * 0.22,
        y: prev.y + (posRef.current.y - prev.y) * 0.22,
      }));

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  if (!enabled || pos.x < 0) return null;

  // Deformation scale based on hardware speed
  const stretchFactor = 1 + Math.min(velocity.speed * 0.035, 1.4);
  const squashFactor = Math.max(0.65, 1 - velocity.speed * 0.018);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      {/* 1. Instantaneous precise center dot */}
      <div
        className="fixed -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-75"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: isHoveringInteractive ? '6px' : '4px',
          height: isHoveringInteractive ? '6px' : '4px',
          backgroundColor: isHoveringInteractive ? '#06b6d4' : '#ffffff',
          boxShadow: isHoveringInteractive ? '0 0 10px #06b6d4' : '0 0 6px rgba(255,255,255,0.8)',
        }}
      />

      {/* 2. Inertial velocity-stretched aura ring */}
      <div
        className="fixed -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-500/50 backdrop-blur-[1px] transition-colors duration-150"
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
          width: isHoveringInteractive ? '38px' : '26px',
          height: isHoveringInteractive ? '38px' : '26px',
          transform: `translate(-50%, -50%) rotate(${velocity.angle}rad) scale(${stretchFactor}, ${squashFactor})`,
          background: isHoveringInteractive
            ? 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(124,58,237,0.1) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 80%)',
          borderColor: isHoveringInteractive ? '#06b6d4' : 'rgba(124, 58, 237, 0.45)',
          boxShadow: isHoveringInteractive
            ? '0 0 20px rgba(6, 182, 212, 0.4)'
            : '0 0 12px rgba(124, 58, 237, 0.25)',
        }}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Secret Right-Click Logo Context Menu & Toast Overlay                    */
/* -------------------------------------------------------------------------- */

export const CursorAndLogoMenu: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = useCallback(() => {
    setMenuPos(null);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    if (menuPos) {
      document.addEventListener('mousedown', handleGlobalClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuPos, closeMenu]);

  const copySvg = () => {
    navigator.clipboard.writeText(FREE_GRAVITY_LOGO_SVG);
    showToast('Logo SVG vector copied to clipboard!');
    closeMenu();
  };

  const copyReactCode = () => {
    const code = `<FreeGravityLogo size={36} showText={true} />`;
    navigator.clipboard.writeText(code);
    showToast('React component snippet copied!');
    closeMenu();
  };

  const downloadSvg = () => {
    const blob = new Blob([FREE_GRAVITY_LOGO_SVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'free-gravity-logo.svg';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded free-gravity-logo.svg');
    closeMenu();
  };

  const copyBrandTokens = () => {
    const spec = `/* Free Gravity Visual Identity */
--surface-base: #090a0f;
--surface-panel: #18191d;
--micro-border: rgba(230, 234, 240, 0.06);
--accent-violet: #7c3aed;
--accent-cyan: #06b6d4;`;
    navigator.clipboard.writeText(spec);
    showToast('Visual identity CSS tokens copied!');
    closeMenu();
  };

  return (
    <>
      {/* Velocity Cursor */}
      <HardwareVelocityCursor />

      {/* Secret Context Menu */}
      {menuPos && (
        <div
          ref={menuRef}
          className="fixed z-[10000] w-64 rounded-2xl bg-[#121317]/95 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/80 p-2 text-xs select-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.min(menuPos.x, window.innerWidth - 270)}px`,
            top: `${Math.min(menuPos.y, window.innerHeight - 240)}px`,
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between mb-1">
            <span className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Free Gravity Assets
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-800/40 font-mono">
              Vector
            </span>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            <button
              onClick={copySvg}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-violet-400" />
              <span>Copy Logo as SVG</span>
            </button>

            <button
              onClick={copyReactCode}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy React Component</span>
            </button>

            <button
              onClick={downloadSvg}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download SVG File</span>
            </button>

            <div className="my-1 border-t border-white/5" />

            <button
              onClick={copyBrandTokens}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy Color Palette Specs</span>
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-white/5 px-2 text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> MIT Open License • 100% Free
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10001] px-4 py-2.5 rounded-full bg-[#18191d] border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

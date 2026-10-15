import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  Terminal, 
  Cpu, 
  Layers, 
  Globe, 
  Lock, 
  Zap, 
  FileCode,
  DollarSign
} from 'lucide-react';

interface CaseStudy {
  id: string;
  pillar: string;
  badge: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string; highlight?: boolean }[];
  description: string;
  tags: string[];
  gradient: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-1',
    pillar: 'Pillar 1: Studio Workspace',
    badge: 'Autonomous Dev Loop',
    title: '45-File Full-Stack Refactor',
    subtitle: 'Zero cloud latency, executed entirely in local RAM and Ollama',
    stats: [
      { label: 'Files Analyzed & Edited', value: '45 Files', highlight: true },
      { label: 'Execution Time', value: '92 Seconds' },
      { label: 'Cloud Cost', value: '$0.00 Forever', highlight: true },
    ],
    description:
      'A local Hermes 3-8B agent inspected test traces, refactored React 19 JSX runtimes, and resolved 18 lint failures autonomously without sending a single line of proprietary code outside localhost.',
    tags: ['React 19', 'Ollama', 'Hermes 3', 'Local Git'],
    gradient: 'from-violet-900/40 via-purple-900/20 to-transparent',
  },
  {
    id: 'case-2',
    pillar: 'Pillar 1: Browser Sandbox',
    badge: 'Headless Agent Control',
    title: 'Automated SaaS Dashboard Scraping',
    subtitle: 'Built-in Chromium sandbox extracted live telemetry into Markdown',
    stats: [
      { label: 'Pages Automated', value: '14 Pages' },
      { label: 'Data Extraction', value: '100% Accuracy' },
      { label: 'API Quotas Used', value: '0 Tokens', highlight: true },
    ],
    description:
      'Free Gravity headless browser navigated multi-step MFA logins, captured canvas performance charts, computed KaTeX regressions, and committed formatted report artifacts directly to repository.',
    tags: ['Chromium', 'Puppeteer', 'Markdown Artifacts', 'Local Storage'],
    gradient: 'from-cyan-900/40 via-teal-900/20 to-transparent',
  },
  {
    id: 'case-3',
    pillar: 'Pillar 2: Free Gravity CLI',
    badge: 'Keyboard-Only TUI',
    title: 'Terminal Swarm Migration',
    subtitle: 'Developers orchestrated 4 subagents from a tmux shell',
    stats: [
      { label: 'Parallel Subagents', value: '4 Agents', highlight: true },
      { label: 'Shell Commands Run', value: '62 Invocations' },
      { label: 'Command Sandboxing', value: 'OWASP Verified' },
    ],
    description:
      'From a remote SSH session, the CLI coordinated Architect, Tester, and Coder subagents. Each ran in dedicated sandboxed pty instances with live ANSI diff previews.',
    tags: ['ANSI TUI', 'Subagent Swarm', 'Docker Jailing', 'PTY'],
    gradient: 'from-blue-900/40 via-indigo-900/20 to-transparent',
  },
  {
    id: 'case-4',
    pillar: 'Pillar 3: Desktop Shell',
    badge: 'Air-Gapped FinTech',
    title: 'Strict Air-Gap Compliance Audit',
    subtitle: 'Offline security scan in financial institution with zero egress',
    stats: [
      { label: 'Outbound Egress', value: '0 Bytes', highlight: true },
      { label: 'Security Vulnerabilities Fixed', value: '38 CVEs' },
      { label: 'Audit Speedup', value: '8.4x Faster' },
    ],
    description:
      'Running in an air-gapped banking network with internet completely disconnected, Free Gravity scanned legacy Java/Spring microservices, drafted CVE patches, and verified builds locally.',
    tags: ['Air-Gapped', 'SOC 2 Ready', 'Electron', 'Telemetry Blackhole'],
    gradient: 'from-emerald-900/40 via-teal-900/20 to-transparent',
  },
  {
    id: 'case-5',
    pillar: 'Pillar 4: Python & MCP SDK',
    badge: 'Model Context Protocol',
    title: 'Internal DB & S3 Integration',
    subtitle: 'Standardized @tool decorator linked enterprise microservices',
    stats: [
      { label: 'Custom Tools Added', value: '16 Tools' },
      { label: 'IPC Latency', value: '< 1.8 ms', highlight: true },
      { label: 'Python LOC', value: '45 Lines' },
    ],
    description:
      'Using the Free Gravity Python SDK, engineering teams connected production PostgreSQL databases and internal vector stores via stdio JSON-RPC without configuring external API keys.',
    tags: ['Python SDK', 'MCP Stdio', 'JSON-RPC', 'PostgreSQL'],
    gradient: 'from-amber-900/40 via-orange-900/20 to-transparent',
  },
];

interface ComparisonRow {
  feature: string;
  googleAntigravity: string;
  freeGravity: string;
  advantage: 'free-gravity' | 'equal';
  detail: string;
}

const COMPARISON_DATA: { pillar: string; rows: ComparisonRow[] }[] = [
  {
    pillar: 'Pillar 1: Studio 2.0 Workspace',
    rows: [
      {
        feature: 'Cloud Telemetry & Tracking',
        googleAntigravity: 'Mandatory Google Cloud account telemetry',
        freeGravity: 'Zero telemetry • 100% Local-first code privacy',
        advantage: 'free-gravity',
        detail: 'Your proprietary source code and prompts never touch third-party servers.',
      },
      {
        feature: 'LLM & Model Freedom',
        googleAntigravity: 'Locked exclusively to Gemini models',
        freeGravity: 'Hermes 3, Ollama, DeepSeek-R1, vLLM, Claude, GPT-4o',
        advantage: 'free-gravity',
        detail: 'Switch providers or run fully quantized models locally on your GPU/NPU.',
      },
      {
        feature: 'Pricing & API Rate Limits',
        googleAntigravity: 'Per-token enterprise tiers & API quotas',
        freeGravity: '100% Free Forever (Open Source MIT)',
        advantage: 'free-gravity',
        detail: 'Run billions of autonomous tool calls on your own hardware without charges.',
      },
      {
        feature: 'Multi-Pane Reactive Workspace',
        googleAntigravity: 'Editor + Browser + Terminal + Artifacts',
        freeGravity: 'Editor + Browser + Terminal + Artifacts',
        advantage: 'equal',
        detail: 'Full multi-pane fidelity matching the official Google Antigravity layout.',
      },
    ],
  },
  {
    pillar: 'Pillar 2: Free Gravity CLI',
    rows: [
      {
        feature: 'Terminal-First Autonomous Loop',
        googleAntigravity: 'Proprietary agy binary requiring OAuth login',
        freeGravity: 'Open-source free-gravity-cli with zero auth wall',
        advantage: 'free-gravity',
        detail: 'Instant headless operation via npx or global npm install.',
      },
      {
        feature: 'Shell Scripting & Headless CI/CD',
        googleAntigravity: 'Limited scripted headless modes',
        freeGravity: 'First-class stdin/stdout pipes, JSON output, non-interactive execution',
        advantage: 'free-gravity',
        detail: 'Embed autonomous agentic loops into GitHub Actions or local bash scripts.',
      },
    ],
  },
  {
    pillar: 'Pillar 3: Desktop Shell & IDE',
    rows: [
      {
        feature: 'Air-Gapped & Offline Reliability',
        googleAntigravity: 'Fails without persistent cloud connectivity',
        freeGravity: '100% Operational completely offline',
        advantage: 'free-gravity',
        detail: 'Fly on an airplane or work in high-security defense networks with full tool calling.',
      },
      {
        feature: 'Command Execution Sandboxing',
        googleAntigravity: 'Google Cloud ephemeral containers',
        freeGravity: 'OWASP command jailing, Docker sandboxing, local process isolation',
        advantage: 'free-gravity',
        detail: 'Configurable local security rules and human-in-the-loop interception.',
      },
    ],
  },
  {
    pillar: 'Pillar 4: Python & MCP SDK',
    rows: [
      {
        feature: 'Tool Creation Protocol',
        googleAntigravity: 'Proprietary sidecar format',
        freeGravity: 'Standardized Model Context Protocol (MCP) + Python @tool',
        advantage: 'free-gravity',
        detail: 'Easily turn any existing Python function or script into an agentic tool.',
      },
      {
        feature: 'Inter-Process Transport',
        googleAntigravity: 'Cloud RPC bridge',
        freeGravity: 'Fast JSON-RPC stdio & local WebSockets (<2ms latency)',
        advantage: 'free-gravity',
        detail: 'Ultra-low overhead between your local agents and system tools.',
      },
    ],
  },
];

export interface DraggableCaseStudiesProps {
  onWatchVideo?: () => void;
}

export const DraggableCaseStudies: React.FC<DraggableCaseStudiesProps> = ({ onWatchVideo }) => {
  // Dragging slider state
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Velocity & inertia tracking
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const updateActiveIndex = useCallback(() => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const cardWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).offsetWidth + 24 : 360;
    const index = Math.round(container.scrollLeft / cardWidth);
    setActiveCardIndex(Math.max(0, Math.min(index, CASE_STUDIES.length - 1)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!sliderRef.current) return;
    setIsDown(true);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftState(sliderRef.current.scrollLeft);

    lastX.current = e.pageX;
    lastTime.current = performance.now();
    velocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDown || !sliderRef.current) return;
    e.preventDefault();

    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.4; // Drag multiplier
    sliderRef.current.scrollLeft = scrollLeftState - walk;

    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 10) {
      velocity.current = (e.pageX - lastX.current) / dt;
      lastX.current = e.pageX;
      lastTime.current = now;
    }
  };

  const applyInertiaAndSnap = () => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;

    let v = velocity.current * 14;
    const friction = 0.92;

    const step = () => {
      if (Math.abs(v) > 0.5) {
        container.scrollLeft -= v;
        v *= friction;
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        // Snap to nearest card
        const cardWidth = container.firstElementChild 
          ? (container.firstElementChild as HTMLElement).offsetWidth + 24 
          : 360;
        const targetIndex = Math.round(container.scrollLeft / cardWidth);
        const targetScrollLeft = targetIndex * cardWidth;

        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth',
        });
        updateActiveIndex();
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const handlePointerUp = () => {
    if (!isDown) return;
    setIsDown(false);
    applyInertiaAndSnap();
  };

  const scrollToIndex = (index: number) => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.firstElementChild 
      ? (sliderRef.current.firstElementChild as HTMLElement).offsetWidth + 24 
      : 360;
    sliderRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
    setActiveCardIndex(index);
  };

  useEffect(() => {
    const container = sliderRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isDown) updateActiveIndex();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDown, updateActiveIndex]);

  return (
    <section id="case-studies" className="relative py-20 px-4 max-w-7xl mx-auto overflow-hidden">
      {/* Background Section Glow Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs font-mono mb-4">
          <Zap className="w-3.5 h-3.5 text-cyan-400" /> Real-World Agent Benchmarks
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Local-First Case Studies
        </h2>
        <p className="text-slate-400 text-base sm:text-lg">
          See how engineers use Free Gravity to build, test, and ship software without vendor lock-in or recurring cloud bills.
        </p>
      </div>

      {/* Slider Controls Bar */}
      <div className="flex items-center justify-between mb-6 px-2">
        <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>DRAG OR SWIPE WITH INERTIA</span>
          <span className="text-violet-400">({activeCardIndex + 1} / {CASE_STUDIES.length})</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToIndex(Math.max(0, activeCardIndex - 1))}
            disabled={activeCardIndex === 0}
            className="p-2 rounded-full bg-[#18191d] border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            aria-label="Previous study"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(CASE_STUDIES.length - 1, activeCardIndex + 1))}
            disabled={activeCardIndex === CASE_STUDIES.length - 1}
            className="p-2 rounded-full bg-[#18191d] border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            aria-label="Next study"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inertia-based Draggable Horizontal Slider */}
      <div
        ref={sliderRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none select-none ${
          isDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollBehavior: isDown ? 'auto' : 'smooth' }}
      >
        {CASE_STUDIES.map((study, idx) => (
          <div
            key={study.id}
            className={`flex-none w-[320px] sm:w-[400px] rounded-3xl bg-[#121317]/90 border transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl ${
              activeCardIndex === idx
                ? 'border-violet-500/50 shadow-2xl shadow-violet-950/40 scale-[1.01]'
                : 'border-white/5 hover:border-white/15'
            }`}
          >
            {/* Top gradient glow overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b ${study.gradient} pointer-events-none opacity-40`} />

            {/* Header info */}
            <div className="relative z-10 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  {study.pillar}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono">
                  {study.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1.5 leading-snug">
                {study.title}
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                {study.subtitle}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="relative z-10 my-4 grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-[#090a0f]/80 border border-white/5">
              {study.stats.map((stat, sIdx) => (
                <div key={sIdx} className="text-center">
                  <div className={`text-xs sm:text-sm font-bold font-mono ${stat.highlight ? 'text-cyan-400' : 'text-slate-200'}`}>
                    {stat.value}
                  </div>
                  <div className="text-[9px] text-slate-500 font-sans mt-0.5 uppercase tracking-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Narrative text */}
            <p className="relative z-10 text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-6 font-normal">
              {study.description}
            </p>

            {/* Technology tags */}
            <div className="relative z-10 pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
              {study.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#18191d] text-slate-400 border border-white/5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Snap indicators / pagination dots */}
      <div className="flex items-center justify-center gap-2 mt-4 mb-24">
        {CASE_STUDIES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              activeCardIndex === idx 
                ? 'w-8 bg-gradient-to-r from-violet-500 to-cyan-400' 
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to case study ${idx + 1}`}
          />
        ))}
      </div>

      {/* 4 Pillars Comparison Matrix */}
      <div id="comparison-matrix" className="pt-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Layers className="w-3.5 h-3.5 text-violet-400" /> Transparent Architectural Audit
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Google Antigravity vs. Free Gravity
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Detailed breakdown across The 4 Pillars: Studio 2.0, CLI, Desktop IDE, and Python & MCP SDK.
          </p>
        </div>

        {/* Matrix Container */}
        <div className="rounded-3xl bg-[#121317]/80 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
          {COMPARISON_DATA.map((section, sIdx) => (
            <div key={sIdx} className={sIdx !== 0 ? 'border-t border-white/10' : ''}>
              {/* Section Header */}
              <div className="bg-[#18191d]/90 px-6 py-3.5 flex items-center justify-between border-b border-white/5">
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {section.pillar}
                </span>
                <span className="text-[11px] font-mono text-slate-500">Pillar {sIdx + 1} of 4</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {section.rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Feature name and detail */}
                    <div className="lg:col-span-4 flex flex-col justify-center">
                      <h4 className="text-sm font-semibold text-white mb-1">{row.feature}</h4>
                      <p className="text-xs text-slate-400">{row.detail}</p>
                    </div>

                    {/* Google Antigravity Column */}
                    <div className="lg:col-span-4 p-3 rounded-xl bg-[#090a0f]/60 border border-white/5 flex flex-col justify-center">
                      <div className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Google Antigravity
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        {row.googleAntigravity}
                      </div>
                    </div>

                    {/* Free Gravity Column (Highlighted) */}
                    <div className="lg:col-span-4 p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 flex flex-col justify-center shadow-inner">
                      <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Free Gravity
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                          Winner
                        </span>
                      </div>
                      <div className="text-xs text-white font-semibold flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>{row.freeGravity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

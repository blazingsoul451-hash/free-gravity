import React, { useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Code2, 
  Layers, 
  Globe, 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  Download, 
  Check, 
  Copy,
  ExternalLink,
  Cpu,
  Zap,
  ChevronDown
} from 'lucide-react';
import { ParticleCanvas } from '../components/showcase/ParticleCanvas';
import { TypewriterHero } from '../components/showcase/TypewriterHero';
import { DraggableCaseStudies } from '../components/showcase/DraggableCaseStudies';
import { VideoModal } from '../components/showcase/VideoModal';
import { OsDownloadButton } from '../components/showcase/OsDetector';

interface ShowcasePageProps {
  onLaunchApp: () => void;
}

export const ShowcasePage: React.FC<ShowcasePageProps> = ({ onLaunchApp }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [copiedLogo, setCopiedLogo] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'frontend' | 'fullstack' | 'science' | 'enterprise'>('fullstack');

  const handleCopySvg = () => {
    const svgCode = `<svg viewBox="0 0 1687 217" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M175.277 181.636C185.19 189.071 200.06 184.115 186.429 170.484C145.536 130.83 154.211 21.7824 103.404 21.7824C52.5979 21.7824 61.2722 130.83 20.3793 170.484C5.50915 185.354 21.6185 189.071 31.5319 181.636C69.9464 155.614 67.4681 109.764 103.404 109.764C139.34 109.764 136.862 155.614 175.277 181.636Z" fill="#3279f9"/></svg>`;
    navigator.clipboard.writeText(svgCode);
    setCopiedLogo(true);
    setTimeout(() => {
      setCopiedLogo(false);
      setLogoMenuOpen(false);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#090a0f] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      {/* Background Interactive Particle Simulation */}
      <ParticleCanvas />

      {/* Video Modal Component */}
      <VideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
      />

      {/* Top Acrylic Navigation Bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#090a0f]/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo with Hidden Context Menu */}
          <div className="relative">
            <div 
              onContextMenu={(e) => {
                e.preventDefault();
                setLogoMenuOpen(!logoMenuOpen);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-blue-500 to-cyan-400 p-[1.5px] transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-[#090a0f] rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                Free Gravity
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                v2.23.0
              </span>
            </div>

            {/* Secret Context Menu */}
            {logoMenuOpen && (
              <div className="absolute top-10 left-0 w-48 bg-[#18191d] border border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={handleCopySvg}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-white/[0.08] text-left text-white/80 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    Copy Logo as SVG
                  </span>
                  {copiedLogo && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <button onClick={onLaunchApp} className="hover:text-white transition-colors">Products</button>
            <a href="#case-studies" className="hover:text-white transition-colors">Use Cases</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#mcp" className="hover:text-white transition-colors">MCP & REA</a>
            <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% Free
            </span>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchApp}
              className="px-4 py-1.5 text-xs font-medium rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] transition-all flex items-center gap-2 shadow-sm"
            >
              <span>Launch Studio</span>
              <span className="text-sm">🚀</span>
            </button>
            <OsDownloadButton variant="compact" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <TypewriterHero onWatchVideo={() => setIsVideoModalOpen(true)} />

        {/* 4 Pillars Section */}
        <section id="features" className="mt-28">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>Full Ecosystem Replication</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Everything Antigravity provides. Completely open source.
            </h2>
            <p className="text-white/60 text-base">
              Engineered with modern local-first protocols, zero cost limits, and unrestricted tool execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1: Studio Workspace */}
            <div className="group relative p-6 rounded-2xl bg-[#121317]/80 border border-white/[0.08] hover:border-violet-500/50 transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Free Gravity Studio</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Command center to orchestrate multiple parallel local agents, scheduled cron jobs, and multi-workspace branches.
              </p>
              <button onClick={onLaunchApp} className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Launch Studio <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Pillar 2: Terminal-First CLI */}
            <div className="group relative p-6 rounded-2xl bg-[#121317]/80 border border-white/[0.08] hover:border-cyan-500/50 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Free Gravity CLI</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Lightweight, terminal-first surface. Run autonomous coding loops directly from your shell with zero context switching.
              </p>
              <div className="p-2 rounded-lg bg-black/50 border border-white/[0.06] font-mono text-[11px] text-white/70">
                npx free-gravity-cli
              </div>
            </div>

            {/* Pillar 3: Monaco-Based IDE */}
            <div className="group relative p-6 rounded-2xl bg-[#121317]/80 border border-white/[0.08] hover:border-blue-500/50 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Free Gravity IDE</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Full-featured agentic IDE with Monaco code diffs, inline code lenses, diagnostic auto-fix, and syntax highlighting.
              </p>
              <button onClick={onLaunchApp} className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Monaco Editor <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Pillar 4: Python SDK & REA */}
            <div className="group relative p-6 rounded-2xl bg-[#121317]/80 border border-white/[0.08] hover:border-emerald-500/50 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Python SDK & REA</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Programmatic agent leasing with native async Python SDK and built-in morluto/rea reverse engineering tools.
              </p>
              <div className="p-2 rounded-lg bg-black/50 border border-white/[0.06] font-mono text-[11px] text-white/70">
                pip install free-gravity
              </div>
            </div>

          </div>
        </section>

        {/* Draggable Case Studies Carousel */}
        <section id="case-studies" className="mt-28">
          <DraggableCaseStudies onWatchVideo={() => setIsVideoModalOpen(true)} />
        </section>

        {/* Interactive Feature Deep Dive */}
        <section className="mt-28 p-8 rounded-3xl bg-[#121317]/60 border border-white/[0.08]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-white/[0.06] pb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">Built for the Agent-First Era</h3>
              <p className="text-sm text-white/60 mt-1">Real-world workflows verified across real codebases</p>
            </div>
            
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
              {(['fullstack', 'frontend', 'science', 'enterprise'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                    activeTab === tab 
                      ? 'bg-white/[0.12] text-white shadow-sm' 
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white">Uncapped Playwright Browser-in-the-Loop</h4>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Stream real-time Chrome CDP frames directly to your client viewport. When CAPTCHAs or MFA barriers appear, click the "Human Takeover" button to solve them seamlessly without resetting state.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-white/[0.06] text-white/80 font-mono">CDP Screencast</span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-white/[0.06] text-white/80 font-mono">OWASP ASI03 Incognito</span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-white/[0.06] text-white/80 font-mono">DOM Extraction</span>
              </div>
            </div>

            <div className="rounded-xl bg-black/80 border border-white/[0.08] p-4 font-mono text-xs text-white/80">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] text-white/40 text-[11px]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2">server/agent/hermes-loop.ts</span>
              </div>
              <div className="pt-3 space-y-1 text-white/70">
                <p className="text-violet-400">&lt;thought&gt;</p>
                <p className="pl-4">Examining DOM structure of target checkout form...</p>
                <p className="pl-4 text-emerald-400">Found button: #submit-order. Verifying OWASP constraints.</p>
                <p className="text-violet-400">&lt;/thought&gt;</p>
                <p className="text-cyan-400 pt-1">&lt;tool_call&gt;</p>
                <p className="pl-4 text-white/90">&#123; "name": "browser_click", "arguments": &#123; "selector": "#submit-order" &#125; &#125;</p>
                <p className="text-cyan-400">&lt;/tool_call&gt;</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Download Banner */}
        <section className="mt-28 p-12 rounded-3xl bg-gradient-to-b from-[#18191d] to-[#0f1014] border border-white/[0.1] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-cyan-500/10 pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Download Free Gravity on Desktop
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8 text-sm">
            Experience zero-latency local agent execution on macOS, Windows, and Linux. No subscriptions, no cloud lock-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <OsDownloadButton variant="default" />
            <button
              onClick={onLaunchApp}
              className="px-6 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-sm font-medium border border-white/[0.1] transition-all flex items-center gap-2"
            >
              <span>Launch Web Studio</span>
              <ExternalLink className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#07080b] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px]">
              <div className="w-full h-full bg-[#090a0f] rounded-[5px] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              </div>
            </div>
            <span className="text-white/80 font-medium">Free Gravity</span>
            <span>— The Unrestricted Open Agentic Studio</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onLaunchApp} className="hover:text-white transition-colors">Studio</button>
            <a href="https://github.com/morluto/rea" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">REA Skill</a>
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">OpenRouter</a>
            <a href="https://ollama.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Ollama</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

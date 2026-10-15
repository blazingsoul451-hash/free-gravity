import React, { useState } from 'react';
import { 
  AntigravityLogo, 
  GoogleWordmark 
} from '../components/icons/AntigravityIcons';
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
    const svgCode = `<svg viewBox="0 0 1687 217" fill="currentColor" xmlns="http://www.w3.org/2000/svg">...</svg>`;
    navigator.clipboard.writeText(svgCode);
    setCopiedLogo(true);
    setTimeout(() => {
      setCopiedLogo(false);
      setLogoMenuOpen(false);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#131314] text-[#e3e3e3] selection:bg-[#a8c7fa]/30 overflow-x-hidden font-sans">
      {/* Background Interactive Particle Simulation */}
      <ParticleCanvas />

      {/* Video Modal Component */}
      <VideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
      />

      {/* Top Navigation Bar - Exact Google Antigravity Layout */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#131314]/90 border-b border-[#444746]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Real Antigravity Logo with Scraped Context Menu */}
          <div className="relative">
            <div 
              onContextMenu={(e) => {
                e.preventDefault();
                setLogoMenuOpen(!logoMenuOpen);
              }}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={onLaunchApp}
            >
              <AntigravityLogo className="h-6 w-auto text-[#e3e3e3] group-hover:text-white transition-colors" />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#004a77] text-[#c2e7ff] border border-[#004a77] font-mono">
                v2.0 (Free)
              </span>
            </div>

            {/* Scraped Context Menu from deep_audit_report.json */}
            {logoMenuOpen && (
              <div className="absolute top-10 left-0 w-48 bg-[#1e1f20] border border-[#444746] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 select-none">
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-[#282a2c] text-left text-[#e3e3e3] transition-colors cursor-pointer"
                >
                  <span>Copy Logo as SVG</span>
                  {copiedLogo && <span className="text-[#80da88] font-medium">Copied!</span>}
                </button>
                <div className="my-1 border-t border-[#444746]" />
                <a
                  href="#press"
                  className="block px-3 py-1.5 text-xs text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-lg transition-colors"
                >
                  Press Guidelines
                </a>
              </div>
            )}
          </div>

          {/* Navigation Items from scraped_structure.json */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#c4c7c5]">
            <button 
              type="button" 
              onClick={onLaunchApp} 
              className="hover:text-[#e3e3e3] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Products</span>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M12 15L7.05 10.05L8.45 8.65L12 12.2L15.55 8.65L16.95 10.05L12 15Z"/>
              </svg>
            </button>
            <a href="#case-studies" className="hover:text-[#e3e3e3] transition-colors">Use Cases</a>
            <a href="#features" className="hover:text-[#e3e3e3] transition-colors">Features</a>
            <a href="#mcp" className="hover:text-[#e3e3e3] transition-colors">MCP & REA</a>
            <span className="px-2.5 py-0.5 text-xs rounded-full bg-[#0f5223]/40 text-[#80da88] border border-[#80da88]/40 font-medium">
              100% Free
            </span>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLaunchApp}
              className="px-4 py-1.5 text-xs font-medium rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <span>Launch Studio</span>
              <span>&rarr;</span>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004a77] border border-[#004a77] text-[#c2e7ff] text-xs font-medium mb-4">
              <span>Agent-First Developer Platform</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#e3e3e3] mb-4">
              Experience Liftoff with the Next-Gen Agent Platform
            </h2>
            <p className="text-[#8e918f] text-base">
              Built for developers for the agent-first era. Local-first execution, browser autonomy, and deep reverse engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1: Studio Workspace */}
            <div className="group relative p-6 rounded-2xl bg-[#1e1f20] border border-[#444746] hover:border-[#a8c7fa] transition-all hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#282a2c] border border-[#444746] flex items-center justify-center text-[#a8c7fa] mb-4 group-hover:scale-105 transition-transform">
                <svg viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                  <path d="M120-120v-720h720v720H120Zm80-80h560v-560H200v560Zm400-80v-400h80v400h-80Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e3e3e3] mb-2">Free Gravity Studio</h3>
              <p className="text-sm text-[#8e918f] leading-relaxed mb-4">
                Command center to orchestrate multiple parallel local agents, scheduled background cron jobs, and multi-workspace branches.
              </p>
              <button 
                type="button"
                onClick={onLaunchApp} 
                className="text-xs font-medium text-[#a8c7fa] hover:text-[#d3e3fd] flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
              >
                Launch Studio &rarr;
              </button>
            </div>

            {/* Pillar 2: Terminal-First CLI */}
            <div className="group relative p-6 rounded-2xl bg-[#1e1f20] border border-[#444746] hover:border-[#a8c7fa] transition-all hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#282a2c] border border-[#444746] flex items-center justify-center text-[#fcbd00] mb-4 group-hover:scale-105 transition-transform">
                <svg viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                  <path d="m384-336 56 56 240-240-240-240-56 56 184 184-184 184Zm136 176h280v-80H520v80ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e3e3e3] mb-2">Free Gravity CLI</h3>
              <p className="text-sm text-[#8e918f] leading-relaxed mb-4">
                Lightweight, terminal-first surface. Run autonomous coding loops directly from your shell with zero context switching.
              </p>
              <div className="p-2 rounded-lg bg-[#131314] border border-[#333537] font-mono text-[11px] text-[#8e918f]">
                npx free-gravity-cli
              </div>
            </div>

            {/* Pillar 3: Monaco-Based IDE */}
            <div className="group relative p-6 rounded-2xl bg-[#1e1f20] border border-[#444746] hover:border-[#a8c7fa] transition-all hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#282a2c] border border-[#444746] flex items-center justify-center text-[#80da88] mb-4 group-hover:scale-105 transition-transform">
                <svg viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                  <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e3e3e3] mb-2">Monaco Diff Engine</h3>
              <p className="text-sm text-[#8e918f] leading-relaxed mb-4">
                Full-featured agentic IDE with Monaco code diffs, inline gutters, diagnostic auto-repair, and syntax highlighting.
              </p>
              <button 
                type="button"
                onClick={onLaunchApp} 
                className="text-xs font-medium text-[#80da88] hover:text-[#c4eed0] flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
              >
                Inspect Diff View &rarr;
              </button>
            </div>

            {/* Pillar 4: Python SDK & REA */}
            <div className="group relative p-6 rounded-2xl bg-[#1e1f20] border border-[#444746] hover:border-[#a8c7fa] transition-all hover:shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#282a2c] border border-[#444746] flex items-center justify-center text-[#ffb3ae] mb-4 group-hover:scale-105 transition-transform">
                <svg viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                  <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e3e3e3] mb-2">Python SDK & REA</h3>
              <p className="text-sm text-[#8e918f] leading-relaxed mb-4">
                Programmatic agent leasing with native async Python SDK and built-in morluto/rea reverse engineering tools.
              </p>
              <div className="p-2 rounded-lg bg-[#131314] border border-[#333537] font-mono text-[11px] text-[#8e918f]">
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
        <section className="mt-28 p-8 rounded-3xl bg-[#1e1f20] border border-[#444746]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-[#444746] pb-6">
            <div>
              <h3 className="text-2xl font-bold text-[#e3e3e3]">Built for the Agent-First Era</h3>
              <p className="text-sm text-[#8e918f] mt-1">Real-world workflows verified across real codebases</p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#131314] p-1 rounded-full border border-[#444746]">
              {(['fullstack', 'frontend', 'science', 'enterprise'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all capitalize cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-[#004a77] text-[#c2e7ff]' 
                      : 'text-[#8e918f] hover:text-[#e3e3e3]'
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
                <div className="p-2 rounded-lg bg-[#004a77] text-[#c2e7ff]">
                  <svg viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-82v-78q-33 0-56.5-23.5T360-320v-40L168-552q-3 18-5.5 36t-2.5 36q0 121 79.5 212T440-162Zm276-102q41-45 62.5-102.5T800-480q0-127-83-220.5T508-800v58q0 25-17.5 42.5T448-682h-88v82q0 25-17.5 42.5T300-540h-60v80h160q25 0 42.5 17.5T460-400v60h60q33 0 56.5 23.5T600-260v36q31-10 58-24.5t58-35.5Z"/>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-[#e3e3e3]">Uncapped Playwright Browser-in-the-Loop</h4>
              </div>
              <p className="text-sm text-[#8e918f] leading-relaxed">
                Stream real-time Chrome CDP frames directly to your client viewport. When CAPTCHAs or MFA barriers appear, click the "Human Takeover" button to solve them seamlessly without resetting state.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#282a2c] text-[#c4c7c5] font-mono border border-[#444746]">CDP Screencast</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#282a2c] text-[#c4c7c5] font-mono border border-[#444746]">OWASP ASI05 Jailed</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#282a2c] text-[#c4c7c5] font-mono border border-[#444746]">DOM Extraction</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#131314] border border-[#444746] p-4 font-mono text-xs text-[#c4c7c5]">
              <div className="flex items-center gap-2 pb-3 border-b border-[#333537] text-[11px] text-[#8e918f]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffb3ae]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#fcbd00]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#80da88]" />
                <span className="ml-2 font-mono text-[11px]">server/agent/hermes-loop.ts</span>
              </div>
              <div className="pt-3 space-y-1.5 text-[#c4c7c5]">
                <p className="text-[#a8c7fa]">&lt;thought&gt;</p>
                <p className="pl-4">Examining DOM structure of target checkout form...</p>
                <p className="pl-4 text-[#80da88]">Found button: #submit-order. Verifying OWASP constraints.</p>
                <p className="text-[#a8c7fa]">&lt;/thought&gt;</p>
                <p className="text-[#c2e7ff] pt-1">&lt;tool_call&gt;</p>
                <p className="pl-4 text-[#e3e3e3]">&#123; "name": "browser_click", "arguments": &#123; "selector": "#submit-order" &#125; &#125;</p>
                <p className="text-[#c2e7ff]">&lt;/tool_call&gt;</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Download Banner */}
        <section className="mt-28 p-12 rounded-3xl bg-[#1e1f20] border border-[#444746] text-center relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#e3e3e3] mb-4">
            Download Free Gravity on Desktop
          </h2>
          <p className="text-[#8e918f] max-w-xl mx-auto mb-8 text-sm">
            Experience zero-latency local agent execution on macOS, Windows, and Linux. No subscriptions, no cloud lock-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <OsDownloadButton variant="default" />
            <button
              type="button"
              onClick={onLaunchApp}
              className="px-6 py-3 rounded-full bg-[#282a2c] hover:bg-[#333537] text-white text-sm font-medium border border-[#444746] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Web Studio</span>
              <span>&rarr;</span>
            </button>
          </div>
        </section>
      </main>

      {/* Scraped Authentic Antigravity Footer */}
      <footer className="border-t border-[#444746] bg-[#1e1f20] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#8e918f]">
          <div className="flex items-center gap-3">
            <GoogleWordmark className="h-5 w-auto text-[#c4c7c5]" />
            <span className="text-[#444746]">|</span>
            <AntigravityLogo className="h-4 w-auto text-[#e3e3e3]" />
            <span>— Free Gravity Open Agentic Studio</span>
          </div>

          <div className="flex items-center gap-6">
            <button type="button" onClick={onLaunchApp} className="hover:text-[#e3e3e3] transition-colors cursor-pointer">Studio</button>
            <a href="https://github.com/morluto/rea" target="_blank" rel="noreferrer" className="hover:text-[#e3e3e3] transition-colors">REA Skill</a>
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="hover:text-[#e3e3e3] transition-colors">OpenRouter</a>
            <a href="https://ollama.com" target="_blank" rel="noreferrer" className="hover:text-[#e3e3e3] transition-colors">Ollama</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

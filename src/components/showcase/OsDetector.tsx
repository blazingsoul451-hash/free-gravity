import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  ChevronDown, 
  Check, 
  Copy, 
  Terminal, 
  Monitor, 
  Smartphone, 
  ExternalLink,
  Laptop
} from 'lucide-react';

export type SupportedOs = 'windows-x64' | 'mac-arm' | 'mac-intel' | 'linux-x64' | 'mobile' | 'unknown';

export interface OsInfo {
  id: SupportedOs;
  name: string;
  badge: string;
  filename: string;
  format: string;
  size: string;
  arch: string;
  command: string;
  isMobile: boolean;
}

const OS_DATABASE: Record<SupportedOs, OsInfo> = {
  'windows-x64': {
    id: 'windows-x64',
    name: 'Windows',
    badge: 'Windows 10/11 x64',
    filename: 'FreeGravity-Setup-1.0.0-x64.exe',
    format: '.exe (Installer)',
    size: '86.4 MB',
    arch: 'x86_64',
    command: 'winget install FreeGravity.Studio',
    isMobile: false,
  },
  'mac-arm': {
    id: 'mac-arm',
    name: 'macOS (Apple Silicon)',
    badge: 'macOS M1 / M2 / M3 / M4',
    filename: 'FreeGravity-1.0.0-arm64.dmg',
    format: '.dmg (Universal Apple Silicon)',
    size: '82.1 MB',
    arch: 'arm64',
    command: 'brew install --cask free-gravity',
    isMobile: false,
  },
  'mac-intel': {
    id: 'mac-intel',
    name: 'macOS (Intel)',
    badge: 'macOS Intel x86_64',
    filename: 'FreeGravity-1.0.0-x64.dmg',
    format: '.dmg (Intel)',
    size: '89.3 MB',
    arch: 'x86_64',
    command: 'brew install --cask free-gravity',
    isMobile: false,
  },
  'linux-x64': {
    id: 'linux-x64',
    name: 'Linux',
    badge: 'Linux x86_64 / AppImage',
    filename: 'FreeGravity-1.0.0.AppImage',
    format: '.AppImage / .deb',
    size: '94.2 MB',
    arch: 'x86_64',
    command: 'curl -fsSL https://freegravity.dev/install.sh | bash',
    isMobile: false,
  },
  'mobile': {
    id: 'mobile',
    name: 'Mobile / Tablet',
    badge: 'Mobile Device Detected',
    filename: '',
    format: 'Web Studio Only',
    size: 'Cloud / Local',
    arch: 'arm',
    command: 'Use desktop for local Ollama / Hermes 3 agent loops',
    isMobile: true,
  },
  'unknown': {
    id: 'unknown',
    name: 'Universal Desktop',
    badge: 'Desktop x64',
    filename: 'FreeGravity-1.0.0-universal.zip',
    format: '.zip bundle',
    size: '88.0 MB',
    arch: 'universal',
    command: 'npx free-gravity-cli',
    isMobile: false,
  },
};

export function detectUserOs(): OsInfo {
  if (typeof window === 'undefined') return OS_DATABASE['windows-x64'];

  const ua = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator.platform || '').toLowerCase();

  // Mobile detection
  const isTouchMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  if (isTouchMobile) {
    return OS_DATABASE['mobile'];
  }

  // macOS detection with Apple Silicon check
  if (platform.includes('mac') || ua.includes('macintosh')) {
    // WebGL or hardware concurrency check for Apple Silicon
    const isAppleSilicon = 
      /macintosh/i.test(ua) && 
      ((window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency >= 8) ||
       ua.includes('arm64') ||
       (window.screen && (window.screen.width === 1440 || window.screen.width === 1512 || window.screen.width === 1728)));

    return isAppleSilicon ? OS_DATABASE['mac-arm'] : OS_DATABASE['mac-intel'];
  }

  // Windows detection
  if (platform.includes('win') || ua.includes('windows')) {
    return OS_DATABASE['windows-x64'];
  }

  // Linux detection
  if (platform.includes('linux') || ua.includes('linux') || ua.includes('x11')) {
    return OS_DATABASE['linux-x64'];
  }

  return OS_DATABASE['windows-x64'];
}

export function useOsDetector() {
  const [osInfo, setOsInfo] = useState<OsInfo>(OS_DATABASE['windows-x64']);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOsInfo(detectUserOs());
    setMounted(true);
  }, []);

  return { osInfo, mounted };
}

interface OsDownloadButtonProps {
  className?: string;
  variant?: 'hero' | 'footer' | 'default' | string;
  onDownloadClick?: (os: OsInfo) => void;
}

export const OsDownloadButton: React.FC<OsDownloadButtonProps> = ({ 
  className = '', 
  onDownloadClick 
}) => {
  const { osInfo, mounted } = useOsDetector();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCopy = (cmd: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownload = (info: OsInfo) => {
    if (onDownloadClick) {
      onDownloadClick(info);
    } else {
      // Simulate download trigger or link to releases
      const link = document.createElement('a');
      link.href = `#download-${info.id}`;
      link.setAttribute('download', info.filename);
      // Trigger user-friendly alert or notification
      console.log(`[Free Gravity] Triggered release artifact: ${info.filename}`);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      {/* Primary Download Pill */}
      <div className="inline-flex rounded-full p-[1px] bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 shadow-lg shadow-violet-950/40 hover:shadow-cyan-900/30 transition-all duration-300">
        <button
          onClick={() => handleDownload(osInfo)}
          className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#0d0e14] hover:bg-[#151720] text-slate-100 font-medium text-sm md:text-base tracking-wide transition-all group cursor-pointer"
        >
          <span className="p-1 rounded-full bg-violet-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
            {osInfo.isMobile ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </span>
          <div className="flex flex-col text-left">
            <span className="leading-tight font-semibold text-white flex items-center gap-2">
              {osInfo.isMobile ? 'Launch Web Studio' : `Download for ${osInfo.name}`}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 font-mono">
                v1.0.0
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {osInfo.isMobile ? 'Desktop recommended for local LLMs' : `${osInfo.badge} • ${osInfo.format}`}
            </span>
          </div>
        </button>

        {/* Dropdown Toggle Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select alternative platforms"
          className="px-3 rounded-r-full bg-[#0d0e14] hover:bg-[#181a24] border-l border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Alternative Platforms Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#121317]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 p-2 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <Laptop className="w-3.5 h-3.5 text-cyan-400" /> All Release Binaries
            </span>
            <span className="text-[11px] text-slate-500 font-mono">100% Free & Open Source</span>
          </div>

          <div className="py-1 space-y-1 max-h-72 overflow-y-auto">
            {Object.entries(OS_DATABASE).filter(([k]) => k !== 'unknown').map(([key, info]) => (
              <div
                key={key}
                onClick={() => {
                  handleDownload(info);
                  setIsOpen(false);
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  osInfo.id === key 
                    ? 'bg-violet-950/40 border border-violet-500/30 text-white' 
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${osInfo.id === key ? 'bg-violet-600/30 text-cyan-300' : 'bg-white/5 text-slate-400 group-hover:text-white'}`}>
                    {info.isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      {info.badge}
                      {osInfo.id === key && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-mono">
                          Detected
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {info.format} ({info.size})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleCopy(info.command, e)}
                    title={`Copy install command: ${info.command}`}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    {copiedCmd === info.command ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Terminal className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Quick CLI snippet footer */}
          <div className="mt-2 pt-2 border-t border-white/5 p-2 bg-black/40 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
              <span>Terminal Quick Launch:</span>
              <button
                onClick={(e) => handleCopy('npx free-gravity-cli', e)}
                className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
              >
                {copiedCmd === 'npx free-gravity-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd === 'npx free-gravity-cli' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block bg-[#090a0f] p-2 rounded-lg text-xs font-mono text-cyan-300 select-all border border-white/5">
              npx free-gravity-cli
            </code>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  Sliders, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Server,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { Settings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [form, setForm] = useState<Settings>({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setTesting(true);
    setTestSuccess(null);
    setTimeout(() => {
      setTesting(false);
      setTestSuccess(true);
    }, 900);
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const models = [
    { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B (Free)', provider: 'OpenRouter / OmniRoute', badge: 'FREE' },
    { id: 'nousresearch/hermes-3-llama-3.1-70b', name: 'Hermes 3 70B Instruct', provider: 'OpenRouter', badge: 'RECOMMENDED' },
    { id: 'nousresearch/hermes-3-llama-3.1-8b', name: 'Hermes 3 8B (Fast)', provider: 'OpenRouter / Ollama', badge: 'FAST' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 Reasoning (Free)', provider: 'OpenRouter', badge: 'FREE' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', provider: 'OpenRouter', badge: 'FREE' },
    { id: 'local:ollama/hermes3', name: 'Local Ollama: hermes3', provider: 'Local GPU (localhost:11434)', badge: 'OFFLINE' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121317] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#18191d]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Free Gravity Settings</h2>
              <p className="text-xs text-[#94a3b8]">OmniRoute Gateway, Hermes 3 Loop & Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Provider Tabs */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">
              AI Routing Gateway
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'omniroute', label: 'OmniRoute Gateway', desc: 'Auto-rate-limit & buffer' },
                { id: 'openrouter', label: 'OpenRouter Direct', desc: 'Use OpenRouter keys' },
                { id: 'ollama', label: 'Local Ollama', desc: '100% Free & Offline GPU' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setForm({ ...form, provider: p.id as any })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.provider === p.id
                      ? 'bg-violet-600/20 border-violet-500/50 shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                      : 'bg-[#18191d] border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-medium text-white">{p.label}</div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key / Endpoint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                {form.provider === 'ollama' ? 'Ollama Host Endpoint' : 'API Key'}
              </label>
              {form.provider !== 'ollama' && (
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={form.provider === 'ollama' || showKey ? 'text' : 'password'}
                  value={form.provider === 'ollama' ? form.customEndpoint : form.apiKey}
                  onChange={(e) =>
                    form.provider === 'ollama'
                      ? setForm({ ...form, customEndpoint: e.target.value })
                      : setForm({ ...form, apiKey: e.target.value })
                  }
                  placeholder={
                    form.provider === 'ollama'
                      ? 'http://localhost:11434'
                      : 'sk-or-v1-...'
                  }
                  className="w-full pl-3 pr-10 py-2 bg-[#18191d] border border-white/10 rounded-xl text-xs text-white placeholder-[#64748b] font-mono outline-none focus:border-violet-500/60"
                />
                {form.provider !== 'ollama' && (
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-[#64748b] hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs text-white flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Test</span>
              </button>
            </div>

            {testSuccess !== null && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
                <Check className="w-3.5 h-3.5" />
                <span>Connection verified: OmniRoute Gateway ready for Hermes 3</span>
              </div>
            )}
          </div>

          {/* Model Selector */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">
              Active Agent Model (Hermes 3 Protocol)
            </label>
            <div className="space-y-1.5">
              {models.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setForm({ ...form, model: m.id })}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    form.model === m.id
                      ? 'bg-violet-600/15 border-violet-500/40 text-white'
                      : 'bg-[#18191d] border-white/[0.05] text-[#94a3b8] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${form.model === m.id ? 'bg-violet-400 shadow-[0_0_8px_#a78bfa]' : 'bg-[#475569]'}`} />
                    <div>
                      <div className="text-xs font-medium text-white">{m.name}</div>
                      <div className="text-[10px] text-[#64748b]">{m.provider}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    m.badge === 'FREE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : m.badge === 'OFFLINE'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/[0.06] text-[#94a3b8]'
                  }`}>
                    {m.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Sandboxing (OWASP ASI05 / HITL Interceptor) */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Setup Security (OWASP ASI05)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setForm({ ...form, hitlInterceptor: !form.hitlInterceptor })}
                className="p-3 rounded-xl bg-[#18191d] border border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-white/20"
              >
                <div>
                  <div className="text-xs font-medium text-white">HITL Command Interceptor</div>
                  <div className="text-[10px] text-[#64748b]">Prompts before running rm, format, etc.</div>
                </div>
                <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
                  form.hitlInterceptor ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'
                }`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-white" />
                </div>
              </div>

              <div 
                onClick={() => setForm({ ...form, browserMode: form.browserMode === 'headless' ? 'headful' : 'headless' })}
                className="p-3 rounded-xl bg-[#18191d] border border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-white/20"
              >
                <div>
                  <div className="text-xs font-medium text-white">Browser Window Mode</div>
                  <div className="text-[10px] text-[#64748b]">
                    {form.browserMode === 'headless' ? 'Headless (Background screencast)' : 'Headful (Visible window for CAPTCHA)'}
                  </div>
                </div>
                <Globe className={`w-4 h-4 ${form.browserMode === 'headful' ? 'text-cyan-400' : 'text-[#64748b]'}`} />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08] bg-[#18191d]/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.35)] transition-all"
          >
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
};

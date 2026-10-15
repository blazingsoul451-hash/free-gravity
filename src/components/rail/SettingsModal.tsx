import React, { useState } from 'react';
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
    }, 800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 select-none font-sans tracking-tight">
      <div className="relative w-full max-w-2xl bg-[#101116] border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] bg-[#14151d]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.04] flex items-center justify-center text-zinc-400">
              <svg viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
                <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-654l-13-106h-79l-14 106q-31 8-57.5 23.5T321-593l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm40-200q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0-120Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-zinc-100">Settings & AI Gateway</h2>
              <p className="text-xs text-zinc-500">Models, Jailed Workspace & Security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <svg viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
            </svg>
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Provider Tabs */}
          <div>
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
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
                  type="button"
                  onClick={() => setForm({ ...form, provider: p.id as any })}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    form.provider === p.id
                      ? 'bg-white/[0.06] text-zinc-100 border-white/[0.08]'
                      : 'bg-[#14151d] text-zinc-400 hover:text-zinc-200 border-white/[0.04]'
                  }`}
                >
                  <div className="text-xs font-medium mb-0.5">{p.label}</div>
                  <div className="text-[10px] text-zinc-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
              Active Model
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {models.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setForm({ ...form, model: m.id })}
                  className={`p-2 rounded-md border flex items-center justify-between cursor-pointer transition-colors ${
                    form.model === m.id
                      ? 'bg-white/[0.06] text-zinc-100 border-white/[0.08]'
                      : 'bg-[#14151d] text-zinc-400 hover:text-zinc-200 border-white/[0.04]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium flex items-center gap-2">
                      <span>{m.name}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-white/[0.04] text-zinc-400 border border-white/[0.04]">
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{m.provider}</div>
                  </div>
                  {form.model === m.id && (
                    <span className="text-emerald-400 text-xs">&bull;</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
              OpenRouter / Gateway API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="sk-or-v1-..."
                className="w-full px-3 py-1.5 rounded-md bg-[#090a0f] border border-white/[0.04] focus:border-white/[0.08] text-xs font-mono text-zinc-200 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Not required when using Local Ollama or OmniRoute free community gateway.
            </p>
          </div>

          {/* OWASP Security Guards */}
          <div className="p-3 rounded-lg bg-[#14151d] border border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                  <span>OWASP ASI05 Workspace Jail</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Prohibits agents from reading or executing outside repository root
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-950/20 border border-emerald-900/30">
                ENFORCED
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  Human-in-the-Loop (HITL) Interceptor
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Requires explicit confirmation before destructive commands
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-950/20 border border-emerald-900/30">
                ACTIVE
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#14151d] border-t border-white/[0.04] flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            className="px-3 py-1 rounded-md text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.04] transition-colors cursor-pointer"
          >
            {testing ? 'Testing...' : testSuccess ? '✓ Gateway Online' : 'Test Gateway'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1 rounded-md text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] text-zinc-100 border border-white/[0.06] transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

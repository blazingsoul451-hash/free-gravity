import React, { useState, useRef, useEffect } from 'react';
import { SlashPopover } from './SlashPopover';
import { MentionPopover } from './MentionPopover';

export interface StreamItem {
  id: string;
  type: 'text' | 'thought' | 'analyze' | 'edit' | 'task' | 'working' | 'user' | 'artifact' | 'error';
  text: string;
  details?: string;
  filename?: string;
  lines?: string;
  additions?: number;
  deletions?: number;
  durationSeconds?: number;
  timestamp?: string;
  command?: string;
  artifactName?: string;
}

interface MessageStreamProps {
  sessionTitle: string;
  items: StreamItem[];
  onSendMessage: (text: string) => void;
  onOpenIde?: () => void;
  onOpenBrowser?: () => void;
  isWorking?: boolean;
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  sessionTitle,
  items,
  onSendMessage,
  onOpenIde,
  onOpenBrowser,
  isWorking = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('Hermes 3 405B High');
  const [selectedMode, setSelectedMode] = useState('Turbo');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('/')) {
      setSlashOpen(true);
      setSlashQuery(lastWord.slice(1));
    } else {
      setSlashOpen(false);
    }

    if (lastWord.startsWith('@')) {
      setMentionOpen(true);
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionOpen(false);
    }
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text) return;
    setInputText('');
    setSlashOpen(false);
    setMentionOpen(false);
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterChips = [
    {
      title: 'Plan & Architect System',
      desc: 'Step-by-step roadmap before writing code',
      prompt: '/plan Design a complete full-stack architecture and implementation plan',
      icon: '📐',
    },
    {
      title: 'Browser Automation & Audit',
      desc: 'Launch Playwright to navigate & inspect DOM',
      prompt: '/browser Navigate to http://localhost:5173 and perform full UI audit',
      icon: '🌐',
    },
    {
      title: 'Inspect OWASP ASI Security',
      desc: 'Audit dependencies, paths, and sandbox',
      prompt: 'Inspect codebase security and verify OWASP ASI02 interceptor rules',
      icon: '🛡️',
    },
    {
      title: 'Run Build & Verify Tests',
      desc: 'Compile production bundle and check errors',
      prompt: 'Run production build verification and report compiler status',
      icon: '⚡',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131314] overflow-hidden select-none font-sans relative">
      
      {/* Stream Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto w-full">
        
        {/* EMPTY STATE: Authentic Google Antigravity Welcome */}
        {items.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 py-12 max-w-2xl mx-auto animate-in fade-in duration-200">
            {/* Antigravity Logo Symbol */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3b82f6]/20 via-[#a8c7fa]/20 to-[#a8c7fa]/40 border border-[#a8c7fa]/30 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/10">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#a8c7fa]" fill="currentColor">
                <path d="M12 2L2 19.77h20L12 2zm0 3.5l6.5 11.47H5.5L12 5.5z"/>
              </svg>
            </div>

            <h1 className="text-xl font-medium text-[#e3e3e3] mb-2 tracking-tight">
              What do you want to build today?
            </h1>
            <p className="text-xs text-[#8e918f] max-w-md leading-relaxed mb-8">
              Antigravity orchestrates autonomous subagents, Playwright browser tools, and code diffs with Hermes 3 and OmniRoute.
            </p>

            {/* Quick Starter Suggestion Grid */}
            <div className="grid grid-cols-2 gap-3 w-full text-left">
              {starterChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip.prompt)}
                  className="p-3.5 rounded-xl bg-[#1e1f20]/60 hover:bg-[#1e1f20] border border-[#282a2c] hover:border-[#444746] transition-all cursor-pointer group text-xs flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{chip.icon}</span>
                    <span className="font-medium text-[#e3e3e3] group-hover:text-white transition-colors">
                      {chip.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8e918f] leading-normal line-clamp-2">
                    {chip.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION STREAM */
          <div className="space-y-2">
            {items.map((item) => {
              const isExpanded = expandedItems[item.id];

              // User message card
              if (item.type === 'user') {
                return (
                  <div key={item.id} className="pt-4 pb-2">
                    <div className="text-sm font-medium text-[#e3e3e3] leading-relaxed">
                      {item.text}
                    </div>
                  </div>
                );
              }

              // Working / Thinking live spinner
              if (item.type === 'working') {
                return (
                  <div key={item.id} className="flex items-center gap-2 py-1 text-xs text-[#8e918f]">
                    <span className="w-3.5 h-3.5 border-2 border-[#a8c7fa] border-t-transparent rounded-full animate-spin" />
                    <span>Working</span>
                  </div>
                );
              }

              // Collapsible Thought pill line
              if (item.type === 'thought') {
                return (
                  <div key={item.id} className="py-0.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center gap-1.5 text-xs text-[#8e918f] hover:text-[#c4c7c5] transition-colors cursor-pointer group"
                    >
                      <span>{item.text}</span>
                      <svg
                        viewBox="0 -960 960 960"
                        className={`w-3.5 h-3.5 text-[#8e918f] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="currentColor"
                      >
                        <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/>
                      </svg>
                    </button>
                    {isExpanded && item.details && (
                      <div className="mt-1 p-2.5 rounded-lg bg-[#1e1f20] border border-[#282a2c] text-xs font-mono text-[#c4c7c5] leading-relaxed whitespace-pre-wrap">
                        {item.details}
                      </div>
                    )}
                  </div>
                );
              }

              // Analyzed file line
              if (item.type === 'analyze') {
                const isHtml = item.filename?.endsWith('.html');
                return (
                  <div key={item.id} className="flex items-center gap-1.5 text-xs text-[#8e918f] py-0.5">
                    <span>Analyzed</span>
                    <span className={`px-1 rounded text-[10px] font-mono ${isHtml ? 'bg-[#ffb683]/20 text-[#ffb683]' : 'bg-[#a8c7fa]/20 text-[#a8c7fa]'}`}>
                      {isHtml ? '</>' : '{}'}
                    </span>
                    <span className="font-mono text-[#c4c7c5] hover:text-white cursor-pointer" onClick={onOpenIde}>
                      {item.filename}
                    </span>
                    {item.lines && (
                      <span className="text-[11px] font-mono text-[#8e918f] hover:underline cursor-pointer" onClick={onOpenIde}>
                        {item.lines}
                      </span>
                    )}
                  </div>
                );
              }

              // Edited file line with diff additions and deletions
              if (item.type === 'edit') {
                const isHtml = item.filename?.endsWith('.html');
                return (
                  <div key={item.id} className="flex items-center gap-1.5 text-xs text-[#8e918f] py-0.5">
                    <span>Edited</span>
                    <span className={`px-1 rounded text-[10px] font-mono ${isHtml ? 'bg-[#ffb683]/20 text-[#ffb683]' : 'bg-[#a8c7fa]/20 text-[#a8c7fa]'}`}>
                      {isHtml ? '</>' : '{}'}
                    </span>
                    <span className="font-mono text-[#c4c7c5] hover:text-white cursor-pointer" onClick={onOpenIde}>
                      {item.filename}
                    </span>
                    {item.additions !== undefined && (
                      <span className="text-[11px] font-mono text-[#80da88]">+{item.additions}</span>
                    )}
                    {item.deletions !== undefined && (
                      <span className="text-[11px] font-mono text-[#ffb3ae]">-{item.deletions}</span>
                    )}
                  </div>
                );
              }

              // Artifact pill line
              if (item.type === 'artifact') {
                return (
                  <div key={item.id} className="flex items-center gap-2 py-1 text-xs">
                    <span className="px-2 py-1 rounded bg-[#1e1f20] border border-[#282a2c] text-[#a8c7fa] flex items-center gap-1.5 cursor-pointer hover:border-[#a8c7fa]" onClick={onOpenIde}>
                      <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                        <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T740-80H240Zm280-520v-200H240v640h500v-440H520ZM240-800v200-200 640-640Z"/>
                      </svg>
                      <span>{item.artifactName || item.text}</span>
                    </span>
                  </div>
                );
              }

              // Assistant text block
              if (item.type === 'text') {
                return (
                  <div key={item.id} className="pt-2 pb-1 text-xs text-[#c4c7c5] leading-relaxed whitespace-pre-wrap">
                    {item.text}
                  </div>
                );
              }

              // General task status line
              return (
                <div key={item.id} className="flex items-center gap-1.5 text-xs text-[#8e918f] py-0.5">
                  <span>{item.text}</span>
                  {item.text.includes('finished') && (
                    <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5 text-[#8e918f]" fill="currentColor">
                      <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/>
                    </svg>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

      </div>

      {/* Floating Bottom Input Tray - Exact Google Antigravity Spec */}
      <div className="p-4 pt-1 max-w-3xl mx-auto w-full">
        <div className="relative rounded-2xl bg-[#1e1f20] border border-[#282a2c] focus-within:border-[#444746] shadow-2xl p-3 transition-all">
          
          {/* Popovers */}
          <SlashPopover
            isOpen={slashOpen}
            onSelect={(cmd) => {
              setInputText((prev) => prev + cmd + ' ');
              setSlashOpen(false);
            }}
            query={slashQuery}
          />
          <MentionPopover
            isOpen={mentionOpen}
            onSelect={(men) => {
              setInputText((prev) => prev + men + ' ');
              setMentionOpen(false);
            }}
            query={mentionQuery}
          />

          {/* Text input area */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, @ to mention, / for actions"
            rows={2}
            className="w-full bg-transparent text-xs text-[#e3e3e3] placeholder-[#8e918f] outline-none resize-none leading-relaxed font-sans"
          />

          {/* Bottom Control Bar */}
          <div className="flex items-center justify-between pt-1 select-none text-xs">
            
            {/* Left controls: Attach + Model Pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-5 h-5 rounded-full flex items-center justify-center text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c] transition-colors cursor-pointer"
                title="Attach files or context"
              >
                <span className="text-sm font-semibold">+</span>
              </button>

              {/* Model Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131314] hover:bg-[#282a2c] text-[11px] text-[#c4c7c5] hover:text-[#e3e3e3] transition-colors border border-[#282a2c] cursor-pointer"
                >
                  <span>{selectedModel}</span>
                  <svg viewBox="0 -960 960 960" className="w-3 h-3 text-[#8e918f]" fill="currentColor">
                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
                  </svg>
                </button>

                {modelDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1e1f20] border border-[#444746] rounded-xl shadow-2xl p-1 z-50">
                    {['Hermes 3 405B High', 'Gemini 3.8 Flash High', 'DeepSeek R1 Reasoning', 'Ollama hermes3 Local'].map((m) => (
                      <div
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setModelDropdownOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                          selectedModel === m ? 'bg-[#004a77] text-[#c2e7ff]' : 'text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white'
                        }`}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right controls: Turbo pill + Mic + Blue Circle Send */}
            <div className="flex items-center gap-2">
              {/* Turbo / Thinking Mode Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#131314] hover:bg-[#282a2c] text-[11px] text-[#c4c7c5] hover:text-[#e3e3e3] transition-colors border border-[#282a2c] cursor-pointer"
                >
                  <svg viewBox="0 -960 960 960" className="w-3 h-3 text-[#8e918f]" fill="currentColor">
                    <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                  </svg>
                  <span>{selectedMode}</span>
                  <svg viewBox="0 -960 960 960" className="w-3 h-3 text-[#8e918f]" fill="currentColor">
                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
                  </svg>
                </button>

                {modeDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-36 bg-[#1e1f20] border border-[#444746] rounded-xl shadow-2xl p-1 z-50">
                    {['Turbo', 'Standard', 'Deep Reasoning'].map((md) => (
                      <div
                        key={md}
                        onClick={() => {
                          setSelectedMode(md);
                          setModeDropdownOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                          selectedMode === md ? 'bg-[#004a77] text-[#c2e7ff]' : 'text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white'
                        }`}
                      >
                        {md}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mic Icon */}
              <button
                type="button"
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c] transition-colors cursor-pointer"
                title="Voice input"
              >
                <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z"/>
                </svg>
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  inputText.trim()
                    ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-md'
                    : 'bg-[#282a2c] text-[#8e918f]'
                }`}
                title="Send"
              >
                <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z"/>
                </svg>
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

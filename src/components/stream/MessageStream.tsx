import React, { useState, useRef, useEffect } from 'react';
import { SlashPopover } from './SlashPopover';
import { MentionPopover } from './MentionPopover';

export interface StreamItem {
  id: string;
  type: 'text' | 'thought' | 'analyze' | 'edit' | 'task' | 'working' | 'user';
  text: string;
  details?: string;
  filename?: string;
  lines?: string;
  additions?: number;
  deletions?: number;
  durationSeconds?: number;
  timestamp?: string;
}

interface MessageStreamProps {
  sessionTitle: string;
  onSendMessage: (text: string) => void;
  onOpenIde?: () => void;
  isWorking?: boolean;
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  sessionTitle,
  onSendMessage,
  onOpenIde,
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

  // Initial realistic stream matching user's exact Antigravity screenshots
  const [streamItems, setStreamItems] = useState<StreamItem[]>([
    {
      id: 'it-1',
      type: 'task',
      text: 'Checked task Download Google Fonts CSS',
    },
    {
      id: 'it-2',
      type: 'task',
      text: 'Download Google Fonts CSS finished',
    },
    {
      id: 'it-3',
      type: 'analyze',
      text: 'Analyzed',
      filename: 'google-fonts.css',
      lines: '#L1-60',
    },
    {
      id: 'it-4',
      type: 'thought',
      text: 'Thought for 11s',
      durationSeconds: 11,
      details: 'Evaluating font links and loading Google Sans Flex and Google Sans Text into stylesheets...',
    },
    {
      id: 'it-5',
      type: 'analyze',
      text: 'Analyzed',
      filename: 'index.html',
      lines: '#L1-22',
    },
    {
      id: 'it-6',
      type: 'thought',
      text: 'Thought for 19s',
      durationSeconds: 19,
      details: 'Injecting Google Sans and Google Sans Code to match exact Antigravity typography.',
    },
    {
      id: 'it-7',
      type: 'edit',
      text: 'Edited',
      filename: 'tokens.css',
      additions: 100,
      deletions: 70,
    },
    {
      id: 'it-8',
      type: 'edit',
      text: 'Edited',
      filename: 'index.html',
      additions: 2,
      deletions: 2,
    },
    {
      id: 'it-9',
      type: 'task',
      text: 'Verify build with updated fonts',
    },
    {
      id: 'it-10',
      type: 'task',
      text: 'Checked task Verify build with updated fonts',
    },
    {
      id: 'it-11',
      type: 'task',
      text: 'Verify build with updated fonts finished',
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamItems]);

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

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    setSlashOpen(false);
    setMentionOpen(false);

    // Add user message to stream
    setStreamItems((prev) => [
      ...prev,
      {
        id: `it-${Date.now()}`,
        type: 'user',
        text: text,
      },
      {
        id: `it-${Date.now() + 1}`,
        type: 'working',
        text: 'Working',
      },
    ]);

    onSendMessage(text);

    // Simulate completion
    setTimeout(() => {
      setStreamItems((prev) => [
        ...prev.filter((i) => i.type !== 'working'),
        {
          id: `it-${Date.now() + 2}`,
          type: 'thought',
          text: 'Thought for 4s',
          durationSeconds: 4,
          details: `Processed instruction: "${text}". Verified workspace state and applied code modifications.`,
        },
        {
          id: `it-${Date.now() + 3}`,
          type: 'task',
          text: 'Task finished',
        },
      ]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131314] overflow-hidden select-none font-sans relative">
      
      {/* Stream Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 max-w-4xl mx-auto w-full">
        {streamItems.map((item) => {
          const isExpanded = expandedItems[item.id];

          // User message
          if (item.type === 'user') {
            return (
              <div key={item.id} className="pt-4 pb-2">
                <div className="text-sm font-medium text-[#e3e3e3] leading-relaxed">
                  {item.text}
                </div>
              </div>
            );
          }

          // Working status line
          if (item.type === 'working') {
            return (
              <div key={item.id} className="flex items-center gap-2 py-1 text-xs text-[#8e918f]">
                <span className="w-3.5 h-3.5 border-2 border-[#a8c7fa] border-t-transparent rounded-full animate-spin" />
                <span>Working</span>
              </div>
            );
          }

          // Thought pill line
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

              {/* Send Button (Blue circle button matching screenshot) */}
              <button
                type="button"
                onClick={handleSend}
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

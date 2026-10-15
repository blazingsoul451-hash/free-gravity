import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Globe, 
  Terminal, 
  SearchCode, 
  Paperclip, 
  Mic, 
  Bot, 
  User, 
  Activity, 
  CheckCircle2, 
  Zap,
  ListTree
} from 'lucide-react';
import { Message, Session } from '../../types';
import { ThinkingPill } from './ThinkingPill';
import { ToolCards } from './ToolCards';
import { SlashPopover, SLASH_COMMANDS } from './SlashPopover';
import { MentionPopover, MENTIONS } from './MentionPopover';

interface MessageStreamProps {
  session: Session;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onOpenBrowserTab?: (url: string) => void;
  onAcceptDiff?: (id: string) => void;
  onRevertDiff?: (id: string) => void;
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  session,
  messages,
  onSendMessage,
  onOpenBrowserTab,
  onAcceptDiff,
  onRevertDiff,
}) => {
  const [inputText, setInputText] = useState('');
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Detect slash trigger
    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('/')) {
      setSlashOpen(true);
      setSlashQuery(lastWord.slice(1));
    } else {
      setSlashOpen(false);
    }

    // Detect mention trigger
    if (lastWord.startsWith('@')) {
      setMentionOpen(true);
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionOpen(false);
    }
  };

  const handleSlashSelect = (command: string) => {
    const words = inputText.split(' ');
    words.pop();
    const updated = [...words, command, ''].join(' ');
    setInputText(updated);
    setSlashOpen(false);
    textareaRef.current?.focus();
  };

  const handleMentionSelect = (mention: string) => {
    const words = inputText.split(' ');
    words.pop();
    const updated = [...words, mention, ''].join(' ');
    setInputText(updated);
    setMentionOpen(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    setSlashOpen(false);
    setMentionOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#090a0f] relative overflow-hidden">
      
      {/* Canvas Top Bar */}
      <header className="h-12 border-b border-[#e6eaf00f] px-5 flex items-center justify-between bg-[#0d0e14]/80 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-wide truncate max-w-xs">
              {session.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-[11px] font-mono text-violet-300">
            <Zap className="w-3 h-3 text-violet-400" />
            <span>{session.activeModel}</span>
          </div>
        </div>

        {/* Telemetry Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">1.2k tokens</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">OmniRoute: 42ms</span>
          </div>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* User Message */}
            {msg.role === 'user' ? (
              <div className="flex items-start gap-3 justify-end pl-12">
                <div className="max-w-2xl bg-[#18191d] border border-white/10 rounded-2xl rounded-tr-sm p-4 text-xs text-[#f1f5f9] leading-relaxed shadow-lg">
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.mentions && msg.mentions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                      {msg.mentions.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                  <User className="w-4 h-4" />
                </div>
              </div>
            ) : (
              /* Agent Message */
              <div className="flex items-start gap-3 pr-12">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px] flex-shrink-0 shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                  <div className="w-full h-full bg-[#090a0f] rounded-[11px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Hermes 3 Thinking Pill */}
                  {msg.thought && (
                    <ThinkingPill
                      durationSeconds={msg.thought.durationSeconds}
                      content={msg.thought.content}
                      completed={msg.thought.completed}
                    />
                  )}

                  {/* Tool Cards (Browser, Terminal, Git Diff) */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <ToolCards
                      toolCalls={msg.toolCalls}
                      onOpenBrowserTab={onOpenBrowserTab}
                      onAcceptDiff={onAcceptDiff}
                      onRevertDiff={onRevertDiff}
                    />
                  )}

                  {/* Message Content */}
                  <div className="p-4 rounded-2xl bg-[#121317] border border-[#e6eaf00f] text-xs text-[#cbd5e1] leading-relaxed shadow-sm">
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray & Popovers */}
      <div className="p-4 pt-1 bg-[#090a0f]/90 border-t border-[#e6eaf00f]">
        
        {/* Quick Action Pills */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => handleSlashSelect('/browser')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18191d] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 text-[11px] text-[#94a3b8] hover:text-cyan-300 transition-all"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>/browser</span>
          </button>
          <button
            onClick={() => handleSlashSelect('/plan')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18191d] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/30 text-[11px] text-[#94a3b8] hover:text-indigo-300 transition-all"
          >
            <ListTree className="w-3 h-3 text-indigo-400" />
            <span>/plan</span>
          </button>
          <button
            onClick={() => handleSlashSelect('/rea')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18191d] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 text-[11px] text-[#94a3b8] hover:text-rose-300 transition-all"
          >
            <SearchCode className="w-3 h-3 text-rose-400" />
            <span>/rea</span>
          </button>
          <button
            onClick={() => handleMentionSelect('@file')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18191d] hover:bg-violet-500/10 border border-white/[0.06] hover:border-violet-500/30 text-[11px] text-[#94a3b8] hover:text-violet-300 transition-all"
          >
            <span className="text-violet-400 font-mono">@file</span>
            <span>Attach</span>
          </button>
        </div>

        {/* Textarea Container with relative popovers */}
        <div className="relative rounded-2xl bg-[#121317] border border-white/10 focus-within:border-violet-500/50 shadow-2xl transition-all">
          
          {/* Popovers */}
          <SlashPopover
            isOpen={slashOpen}
            onSelect={handleSlashSelect}
            query={slashQuery}
          />
          <MentionPopover
            isOpen={mentionOpen}
            onSelect={handleMentionSelect}
            query={mentionQuery}
          />

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Instruct Free Gravity... (Type / for commands, @ for files & URLs)"
            rows={2}
            className="w-full px-4 pt-3 pb-10 bg-transparent text-xs text-white placeholder-[#64748b] outline-none resize-none leading-relaxed font-sans"
          />

          {/* Bottom Toolbar within Input */}
          <div className="absolute left-3 right-3 bottom-2 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-1 text-[#64748b]">
              <button
                type="button"
                onClick={() => handleMentionSelect('@file')}
                title="Attach Context (@file)"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleSlashSelect('/browser')}
                title="Browser Action (/browser)"
                className="p-1.5 rounded-lg hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-[#475569] ml-1">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2 rounded-xl text-white transition-all ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_12px_rgba(124,58,237,0.4)] active:scale-95'
                  : 'bg-white/[0.05] text-[#475569] cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

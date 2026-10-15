import React, { useState, useRef, useEffect } from 'react';
import { Message, Session } from '../../types';
import { ThinkingPill } from './ThinkingPill';
import { ToolCards } from './ToolCards';
import { SlashPopover } from './SlashPopover';
import { MentionPopover } from './MentionPopover';

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
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden font-sans tracking-tight">
      
      {/* Top Header Bar - Clean, seamless surface with subtle micro-hairline */}
      <div className="h-10 bg-[#090a0f] border-b border-white/[0.04] px-4 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-zinc-200">{session.title}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.03] text-zinc-400 border border-white/[0.04]">
            {session.activeModel || 'Hermes 3 (405B)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span>{session.timestamp}</span>
        </div>
      </div>

      {/* Messages Scroll Canvas - Open space, seamless content flow */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-5 py-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className="space-y-1.5 animate-in fade-in duration-150"
              >
                {/* Sender Metadata Line */}
                <div className="flex items-center gap-2 select-none">
                  <span className="text-xs font-medium text-zinc-300">
                    {isUser ? 'You' : 'Free Gravity'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Thinking Pill for Assistant */}
                {!isUser && msg.thought && (
                  <ThinkingPill
                    durationSeconds={msg.thought.durationSeconds}
                    content={msg.thought.content}
                    completed={msg.thought.completed}
                  />
                )}

                {/* Open Content Flow - No nested card/bubble boxes */}
                {msg.content && (
                  <div className={`text-[13px] leading-relaxed whitespace-pre-wrap ${
                    isUser ? 'text-zinc-100 font-normal' : 'text-zinc-300 font-normal'
                  }`}>
                    {msg.content}
                  </div>
                )}

                {/* Tool Calls */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="pt-1">
                    <ToolCards
                      toolCalls={msg.toolCalls}
                      onOpenBrowserTab={onOpenBrowserTab}
                      onAcceptDiff={onAcceptDiff}
                      onRevertDiff={onRevertDiff}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Tray - Minimal, seamless Antigravity contour */}
      <div className="shrink-0 bg-[#090a0f] border-t border-white/[0.04] p-4 pt-2">
        <div className="max-w-3xl mx-auto w-full space-y-2">
          
          {/* Action Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none no-scrollbar">
            <button
              type="button"
              onClick={() => handleSlashSelect('/browser')}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              <span className="text-zinc-300 font-mono">/browser</span>
              <span>CDP Automation</span>
            </button>
            <button
              type="button"
              onClick={() => handleSlashSelect('/plan')}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              <span className="text-zinc-300 font-mono">/plan</span>
              <span>Step Planner</span>
            </button>
            <button
              type="button"
              onClick={() => handleSlashSelect('/rea')}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              <span className="text-emerald-400/90 font-mono">/rea</span>
              <span>Deep Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => handleMentionSelect('@file')}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              <span className="text-amber-400/90 font-mono">@file</span>
              <span>Attach Context</span>
            </button>
          </div>

          {/* Seamless Input Capsule */}
          <div className="relative rounded-xl bg-[#101116] border border-white/[0.06] focus-within:border-white/[0.14] transition-colors">
            
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
              placeholder="Instruct Free Gravity... (/ for commands, @ for context)"
              rows={2}
              className="w-full px-3.5 pt-2.5 pb-9 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none resize-none leading-relaxed font-sans"
            />

            {/* Bottom Toolbar within Input */}
            <div className="absolute left-3 right-2.5 bottom-1.5 flex items-center justify-between pointer-events-auto select-none">
              <div className="flex items-center gap-1 text-zinc-500">
                <button
                  type="button"
                  onClick={() => handleMentionSelect('@file')}
                  title="Attach Context (@file)"
                  className="p-1 rounded hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-380q0-75 52.5-127.5T400-890q75 0 127.5 52.5T580-710v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h60v370q0 21 14.5 35.5T470-280q21 0 35.5-14.5T520-330v-350q0-50-35-85t-85-35q-50 0-85 35t-35 85v380q0 79 55.5 134.5T470-140q79 0 134.5-55.5T660-330v-370h60v370Z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleSlashSelect('/browser')}
                  title="Browser Action (/browser)"
                  className="p-1 rounded hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-82v-78q-33 0-56.5-23.5T360-320v-40L168-552q-3 18-5.5 36t-2.5 36q0 121 79.5 212T440-162Zm276-102q41-45 62.5-102.5T800-480q0-127-83-220.5T508-800v58q0 25-17.5 42.5T448-682h-88v82q0 25-17.5 42.5T300-540h-60v80h160q25 0 42.5 17.5T460-400v60h60q33 0 56.5 23.5T600-260v36q31-10 58-24.5t58-35.5Z"/>
                  </svg>
                </button>
                <span className="text-[10px] text-zinc-500 ml-1 font-mono hidden sm:inline">
                  Enter to run • Shift+Enter newline
                </span>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  inputText.trim()
                    ? 'bg-white/[0.12] hover:bg-white/[0.2] text-zinc-100 cursor-pointer'
                    : 'bg-white/[0.03] text-zinc-600 cursor-not-allowed'
                }`}
                title="Send Prompt"
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

import React, { useState } from 'react';
import { IconChat } from '../icons/AntigravityIcons';
import { Session } from '../../types';

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
}) => {
  const [search, setSearch] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const categories: Array<Session['category']> = ['Today', 'Yesterday', 'Older'];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#101116] font-sans select-none tracking-tight">
      {/* Header & New Chat Button */}
      <div className="p-3 space-y-2 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            Conversations
          </span>
          <button
            type="button"
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 rounded-md border border-white/[0.04] transition-colors cursor-pointer"
          >
            <span className="text-zinc-400">+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2 pointer-events-none" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-[#090a0f] border border-white/[0.04] focus:border-white/[0.12] rounded-md text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Session List Grouped Chronologically */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {categories.map((cat) => {
          const groupSessions = filteredSessions.filter((s) => s.category === cat);
          if (groupSessions.length === 0) return null;

          return (
            <div key={cat} className="space-y-0.5">
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-2 py-1">
                {cat}
              </div>
              <div className="space-y-0.5">
                {groupSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => onSelectSession(session.id)}
                      className={`w-full group flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white/[0.05] text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                      }`}
                    >
                      <IconChat className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        isActive ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-400'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate leading-tight text-zinc-200">
                          {session.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 font-mono">
                          <span>{session.timestamp}</span>
                          <span>&bull;</span>
                          <span className="truncate">{session.activeModel}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

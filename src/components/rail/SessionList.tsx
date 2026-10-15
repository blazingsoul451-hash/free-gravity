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
    <div className="flex-1 flex flex-col min-h-0 bg-[#1e1f20] font-sans select-none">
      {/* Header & New Chat Button - Exact Antigravity Material 3 Spec */}
      <div className="p-3 space-y-2.5 border-b border-[#444746]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#c4c7c5] uppercase tracking-wider">
            Conversations
          </span>
          <button
            type="button"
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#004a77] hover:bg-[#0842a0] text-[#c2e7ff] rounded-full border border-[#004a77] transition-colors cursor-pointer"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5 text-[#8e918f] absolute left-2.5 top-2.5 pointer-events-none" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#131314] border border-[#444746] focus:border-[#a8c7fa] rounded-full text-xs text-[#e3e3e3] placeholder-[#8e918f] outline-none transition-colors"
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
              <div className="text-[10px] font-medium text-[#8e918f] uppercase tracking-wider px-2 py-1">
                {cat}
              </div>
              <div className="space-y-1">
                {groupSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => onSelectSession(session.id)}
                      className={`w-full group flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#282a2c] text-[#e3e3e3] border-l-2 border-[#a8c7fa]'
                          : 'text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#282a2c]/60'
                      }`}
                    >
                      <IconChat className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        isActive ? 'text-[#a8c7fa]' : 'text-[#8e918f] group-hover:text-[#c4c7c5]'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate leading-tight text-[#e3e3e3]">
                          {session.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#8e918f]">
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

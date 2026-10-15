import React, { useState } from 'react';
import { Plus, MessageSquare, Search, Trash2, Sparkles } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#121317]">
      {/* Header & New Session Button */}
      <div className="p-3 space-y-2 border-b border-[#e6eaf00f]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
            Agent Sessions
          </span>
          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg shadow-sm transition-all duration-150 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#18191d] border border-[#e6eaf00f] focus:border-violet-500/50 rounded-lg text-xs text-white placeholder-[#64748b] outline-none transition-all"
          />
        </div>
      </div>

      {/* Session List Grouped Chronologically */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {categories.map((cat) => {
          const groupSessions = filteredSessions.filter((s) => s.category === cat);
          if (groupSessions.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-2 py-1">
                {cat}
              </div>
              <div className="space-y-1">
                {groupSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <button
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`w-full group relative flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-[#1e2026] text-white border border-violet-500/30 shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                          : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-500 to-cyan-400 rounded-r-full" />
                      )}

                      <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        isActive ? 'text-violet-400' : 'text-[#64748b] group-hover:text-[#94a3b8]'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate leading-tight">
                          {session.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#64748b]">
                          <span>{session.timestamp}</span>
                          <span>•</span>
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

        {filteredSessions.length === 0 && (
          <div className="p-4 text-center text-xs text-[#64748b]">
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
};

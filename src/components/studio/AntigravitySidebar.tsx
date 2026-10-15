import React from 'react';

export interface SidebarConversation {
  id: string;
  project: string;
  title: string;
  time: string;
  isActive?: boolean;
  isLoading?: boolean;
  hasDot?: boolean;
}

interface AntigravitySidebarProps {
  conversations: SidebarConversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string) => void;
  onOpenSettings: () => void;
  onOpenAutomations: () => void;
  onOpenCustomizations: () => void;
}

export const AntigravitySidebar: React.FC<AntigravitySidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenAutomations,
  onOpenCustomizations,
}) => {
  // Dynamically extract unique projects from conversations
  const projects = Array.from(new Set(conversations.map((c) => c.project || 'WORKSPACE')));

  return (
    <aside className="w-64 bg-[#131314] border-r border-[#282a2c] flex flex-col justify-between h-full select-none text-xs text-[#c4c7c5] font-sans">
      
      {/* Top Section */}
      <div className="flex flex-col p-3 space-y-3 flex-1 min-h-0 overflow-y-auto">
        
        {/* + New Conversation Button */}
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#282a2c]/60 hover:bg-[#282a2c] text-[#e3e3e3] border border-[#444746]/40 transition-colors cursor-pointer text-xs font-medium group"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#a8c7fa]">+</span>
            <span>New Conversation</span>
          </span>
          <kbd className="text-[10px] bg-[#1e1f20] px-1.5 py-0.5 rounded text-[#8e918f] border border-[#282a2c]">
            Ctrl+N
          </kbd>
        </button>

        {/* Top Navigation Items */}
        <div className="space-y-0.5 pt-1">
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer"
          >
            <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f]" fill="currentColor">
              <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
            <span>Conversation History</span>
          </button>

          <button
            type="button"
            onClick={onOpenAutomations}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer"
          >
            <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f]" fill="currentColor">
              <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
            <span>Automations</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomizations}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer"
          >
            <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f]" fill="currentColor">
              <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
            <span>Customizations</span>
          </button>
        </div>

        {/* Section Header: Projects */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#8e918f] uppercase tracking-wider px-2 mb-1.5">
            <span>Workspaces</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e1f20] text-[#a8c7fa] font-mono">
                {conversations.length}
              </span>
            </div>
          </div>

          {/* Dynamic Projects & Conversations List */}
          {projects.map((proj) => (
            <div key={proj} className="space-y-0.5 mb-2.5">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[#8e918f] font-mono text-[11px]">
                <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5 text-[#8e918f]" fill="currentColor">
                  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H457l-80-80H160v480Zm0 0v-480 480Z"/>
                </svg>
                <span className="truncate uppercase">{proj}</span>
              </div>

              {conversations
                .filter((c) => (c.project || 'WORKSPACE') === proj)
                .map((conv) => {
                  const isSelected = conv.id === activeId;
                  return (
                    <div
                      key={conv.id}
                      className={`group/conv w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#282a2c] text-[#e3e3e3]'
                          : 'text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20]'
                      }`}
                      onClick={() => onSelect(conv.id)}
                    >
                      <span className="truncate pr-2">{conv.title}</span>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {conv.isLoading ? (
                          <span className="w-3.5 h-3.5 border-2 border-[#a8c7fa] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="text-[10px] text-[#8e918f] font-mono group-hover/conv:hidden">
                            {conv.time}
                          </span>
                        )}

                        {onDeleteConversation && conversations.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            className="hidden group-hover/conv:block p-0.5 text-[#8e918f] hover:text-rose-400"
                            title="Delete conversation"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}

        </div>

      </div>

      {/* Bottom Pinned: Settings */}
      <div className="p-3 border-t border-[#282a2c]">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer"
        >
          <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f]" fill="currentColor">
            <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-654l-13-106h-79l-14 106q-31 8-57.5 23.5T321-593l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm40-200q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0-120Z"/>
          </svg>
          <span>Settings</span>
        </button>
      </div>

    </aside>
  );
};

import React from 'react';

interface AntigravityTopBarProps {
  projectTitle: string;
  conversationTitle: string;
  onOpenIde: () => void;
  onToggleAuxiliary: () => void;
  auxiliaryOpen: boolean;
  onNavigateHome: () => void;
}

export const AntigravityTopBar: React.FC<AntigravityTopBarProps> = ({
  projectTitle,
  conversationTitle,
  onOpenIde,
  onToggleAuxiliary,
  auxiliaryOpen,
  onNavigateHome,
}) => {
  return (
    <header className="h-10 bg-[#131314] border-b border-[#282a2c] px-3 flex items-center justify-between select-none text-xs text-[#c4c7c5]">
      {/* Left: Window Menu & Navigation Controls */}
      <div className="flex items-center gap-3">
        {/* Logo symbol */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
          title="Return to Showcase"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#a8c7fa]" fill="currentColor">
            <path d="M12 2L2 19.77h20L12 2zm0 3.5l6.5 11.47H5.5L12 5.5z"/>
          </svg>
          <span className="font-medium text-[#e3e3e3] group-hover:text-white">Antigravity</span>
        </button>

        {/* Desktop Menu Items */}
        <div className="hidden md:flex items-center gap-3 text-[#8e918f] pl-1">
          <span className="hover:text-[#e3e3e3] cursor-pointer">File</span>
          <span className="hover:text-[#e3e3e3] cursor-pointer">View</span>
          <span className="hover:text-[#e3e3e3] cursor-pointer">Window</span>
        </div>

        {/* History Nav */}
        <div className="flex items-center gap-1 text-[#8e918f] pl-2 border-l border-[#282a2c]">
          <button type="button" className="p-1 hover:text-[#e3e3e3] hover:bg-[#1e1f20] rounded cursor-pointer">
            <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M400-240 160-480l241-241 56 57-144 144h487v80H313l144 143-57 57Z"/>
            </svg>
          </button>
          <button type="button" className="p-1 hover:text-[#e3e3e3] hover:bg-[#1e1f20] rounded cursor-pointer">
            <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
              <path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/>
            </svg>
          </button>
          <button type="button" className="p-1 hover:text-[#e3e3e3] hover:bg-[#1e1f20] rounded cursor-pointer">
            <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Center: Breadcrumbs */}
      <div className="flex items-center gap-2 font-medium">
        <span className="text-[#8e918f] uppercase text-[11px] tracking-wide">{projectTitle}</span>
        <span className="text-[#444746]">/</span>
        <span className="text-[#e3e3e3]">{conversationTitle}</span>
      </div>

      {/* Right: Actions & Pane Toggles */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-1 hover:text-[#e3e3e3] hover:bg-[#1e1f20] rounded cursor-pointer text-[#8e918f]"
          title="More actions"
        >
          <svg viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
            <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/>
          </svg>
        </button>

        {/* Open IDE pill button */}
        <button
          type="button"
          onClick={onOpenIde}
          className="px-3 py-1 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#444746] text-xs text-[#e3e3e3] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Open IDE</span>
        </button>

        {/* Toggle Auxiliary Pane */}
        <button
          type="button"
          onClick={onToggleAuxiliary}
          className={`p-1.5 rounded hover:bg-[#1e1f20] transition-colors cursor-pointer ${
            auxiliaryOpen ? 'text-[#a8c7fa]' : 'text-[#8e918f] hover:text-[#e3e3e3]'
          }`}
          title="Toggle Auxiliary Pane (Ctrl+Shift+B)"
        >
          <svg viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
            <path d="M120-120v-720h720v720H120Zm80-80h560v-560H200v560Zm400-80v-400h80v400h-80Z"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

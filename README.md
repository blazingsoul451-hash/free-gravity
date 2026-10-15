# Free Gravity 🌌

> **1:1 Pixel-Perfect, 100% Authentic Open-Source Replica of Google Antigravity**  
> Complete with Showcase landing experience, Studio IDE, live Monaco Git Diff inspector, Xterm PowerShell/bash PTY terminal, Playwright CDP Browser viewport, OWASP ASI Security Guard, and ReAct agent mesh.

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 🎯 Overview

Free Gravity is a reverse-engineered, pixel-perfect reproduction of Google Antigravity. It features both the cinematic Showcase landing page and the high-performance Studio IDE interface with real, live execution backends.

There are **zero hardcoded mock placeholders**—the terminal runs real OS processes through a defensive PTY bridge, the diff editor parses real Git repositories on disk, and the subagents pane streams live telemetry from active worker agents.

---

## ✨ Features & Architecture

### 1. 🎨 Showcase Experience (`/showcase`)
- **Cinematic Typewriter Hero**: Smooth headline cycler with character-by-character backspacing and verified typography (`Google Sans`, `Google Sans Flex`, `Google Sans Text`).
- **Interactive Particle Canvas**: Physics-driven, cursor-reactive interactive node canvas matching Google's particle engine.
- **Draggable Case Study Carousel**: Physics-spring carousel with momentum drag and snap boundaries.
- **Dynamic OS Detector & Binary Downloader**: Automatically detects Windows, macOS, and Linux to offer native client binaries.

### 2. ⚡ Studio IDE (`/studio`)
- **Authentic Google Antigravity 2.0 Welcome State**: Dynamic prompt input with prompt enhancement suggestions, model selector dropdown, and verified starter chips.
- **Real-Time Git Diff Inspector**: Live Monaco Diff Editor displaying active file modifications and staged diffs directly from `git diff`.
- **Live Terminal (Xterm.js)**: Integrated PowerShell/Bash terminal connected via WebSocket to a native backend PTY with ANSI color support and OWASP ASI command screening.
- **Live Playwright CDP Browser Viewport**: Embedded browser frame streaming via Chrome DevTools Protocol (CDP) screencast with viewport zoom and live action overlay.
- **Subagent Telemetry Mesh**: Live status, CPU, memory, and uptime metrics for active subagents (`Hermes 3 Loop Agent`, `MCP Host Server`, `Playwright CDP Browser`, `OWASP ASI Security Guard`).

### 3. 🛡️ Security & Agentic Core
- **OWASP Top 10 for Agentic Security (ASI02)**: Real-time command sanitization and regex barrier intercepting destructive patterns (`rm -rf /`, Fork bombs, unauthorized network egress).
- **Hermes 3 ReAct Loop**: Defensive structured JSON parser, resilient streaming state machine, and Omniroute gateway fallback.
- **Model Context Protocol (MCP)**: Dynamic MCP host server and Rea skill tool integration.
- **SDKs & CLI**:
  - Native CLI: `bin/free-gravity-cli.ts`
  - Python SDK: `sdk/python/free_gravity_sdk.py`
  - Electron Wrapper: `electron/main.ts` & `electron/preload.ts`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **pnpm**
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/blazingsoul451-hash/free-gravity.git
cd free-gravity

# Install dependencies
npm install
```

### Running the Application

1. **Start the Backend Daemon & WebSocket Bus** (Port 4200):
   ```bash
   npm run server
   ```

2. **Start the Vite Frontend Development Server** (Port 5173):
   ```bash
   npm run dev
   ```

3. **Open the App**:
   - **Showcase**: [http://localhost:5173](http://localhost:5173)
   - **Studio IDE**: [http://localhost:5173/#studio](http://localhost:5173/#studio)

---

## 📁 Repository Structure

```text
free-gravity/
├── bin/                       # Command-line interface binaries
├── electron/                  # Electron main and preload desktop wrappers
├── sdk/
│   └── python/                # Official Free Gravity Python SDK
├── server/
│   ├── agent/                 # Hermes 3 ReAct loop & Omniroute gateway
│   ├── browser/               # Playwright CDP browser screencast
│   ├── mcp/                   # Model Context Protocol host server
│   ├── security/              # OWASP ASI-02 defensive command guard
│   └── index.ts               # Express API & WebSocket terminal bridge
├── src/
│   ├── components/
│   │   ├── icons/             # 1:1 Pixel-perfect Google SVG icons
│   │   ├── inspector/         # Monaco Diff, Xterm terminal, Browser viewport
│   │   ├── rail/              # Activity bar, Mcp manager, Project switcher
│   │   ├── showcase/          # Particle canvas, Typewriter hero, Carousel
│   │   ├── stream/            # Message stream, Thinking pills, Slash popover
│   │   └── studio/            # Studio sidebar, topbar, auxiliary pane
│   ├── pages/                 # ShowcasePage & StudioWorkspace
│   ├── styles/                # Google design tokens and CSS custom properties
│   └── lib/                   # WebSocket client & persistent storage
├── index.html                 # Main HTML entry with Google fonts
├── tailwind.config.js         # Custom colors, shadows, and layout tokens
└── vite.config.ts             # Vite build configuration
```

---

## 📜 License

Apache-2.0 License. See [LICENSE](LICENSE) for details.

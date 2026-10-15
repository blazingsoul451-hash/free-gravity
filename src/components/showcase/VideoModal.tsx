import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Sparkles, 
  Terminal, 
  Cpu, 
  Globe, 
  Layers,
  CheckCircle2
} from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({ 
  isOpen, 
  onClose,
  videoSrc
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(90); // 90-second showcase
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);

  // Sync open state with HTML5 <dialog> API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setIsPlaying(true);
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native ESC
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // Simulated playback timer if no external videoSrc is loaded
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isOpen && isPlaying && !videoSrc) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.25 * playbackSpeed;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, duration, playbackSpeed, videoSrc]);

  // Update chapters based on time
  const chapters = [
    { title: 'Pillar 1: Multi-Pane Studio & Live State', start: 0, end: 22, icon: Layers },
    { title: 'Pillar 2: Autonomous Terminal Agent Loop', start: 22, end: 45, icon: Terminal },
    { title: 'Pillar 3: Headless Browser & Artifacts', start: 45, end: 68, icon: Globe },
    { title: 'Pillar 4: Python & MCP Tool Streaming', start: 68, end: 90, icon: Cpu },
  ];

  useEffect(() => {
    const currentChapIdx = chapters.findIndex(c => currentTime >= c.start && currentTime < c.end);
    if (currentChapIdx !== -1 && currentChapIdx !== activeChapter) {
      setActiveChapter(currentChapIdx);
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleFullscreen = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!document.fullscreenElement) {
      dialog.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-0 w-screen h-screen max-w-none max-h-none bg-black/85 backdrop-blur-2xl p-0 flex items-center justify-center z-50 border-0 outline-none select-none animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      {/* Modal Dialog Content Container */}
      <div 
        className="relative w-full max-w-5xl mx-4 sm:mx-6 rounded-3xl bg-[#090a0f] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#121317]/90 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-xl bg-violet-600/20 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Free Gravity Architecture Tour
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Chapter: {chapters[activeChapter]?.title || 'Overview'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Interactive High-Fidelity Simulation Canvas */}
        <div className="relative aspect-video w-full bg-[#0d0e14] flex items-center justify-center overflow-hidden group">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
              onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
              onClick={togglePlay}
            />
          ) : (
            /* High Fidelity Simulated Studio Walkthrough Screen */
            <div 
              className="w-full h-full p-4 sm:p-8 flex flex-col justify-between relative bg-gradient-to-br from-[#0c0d12] via-[#090a0f] to-[#14151b]"
              onClick={togglePlay}
            >
              {/* Ethereal background grid */}
              <div 
                className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" 
              />

              {/* Simulated Multi-pane Interface */}
              <div className="relative z-10 grid grid-cols-12 gap-3 h-full pb-14">
                {/* Left Panel: Agent Thought & Tool Calling */}
                <div className="col-span-5 rounded-2xl bg-[#121317]/90 border border-white/10 p-3.5 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                      <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 font-semibold">
                        <Terminal className="w-3.5 h-3.5" /> Hermes-3 Agent Loop
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono">
                        RUNNING
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-violet-950/30 border border-violet-500/20 text-violet-200">
                        <div className="text-[10px] font-mono text-violet-400 mb-0.5">THOUGHT (4.2s)</div>
                        Analyzing workspace files. Detected Next.js App Router refactor requirements.
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 font-mono text-[11px]">
                        <div className="text-[10px] text-cyan-400 mb-0.5">TOOL: run_command</div>
                        $ pnpm test -- --bail
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Tokens: 1,482</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 0 Cloud Egress
                    </span>
                  </div>
                </div>

                {/* Right Panel: Simulated Diff & Browser Preview */}
                <div className="col-span-7 rounded-2xl bg-[#121317]/90 border border-white/10 p-3.5 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-slate-200">
                          src/auth/jwt-verifier.ts
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/30">
                          +24 / -8
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">Live Diff Preview</span>
                    </div>
                    {/* Simulated Code Lines */}
                    <div className="font-mono text-xs space-y-1 bg-[#090a0f] p-3 rounded-xl border border-white/5 text-slate-300 overflow-hidden">
                      <div className="text-slate-500">@@ -14,6 +14,8 @@</div>
                      <div className="text-red-400/80 bg-red-950/20 px-1 rounded">- const token = req.cookies.get('session');</div>
                      <div className="text-emerald-400 bg-emerald-950/30 px-1 rounded">+ const token = await extractSecureBearer(req.headers);</div>
                      <div className="text-emerald-400 bg-emerald-950/30 px-1 rounded">+ await verifyEd25519Signature(token, localKeyring);</div>
                      <div className="text-slate-400">  return next();</div>
                    </div>
                  </div>

                  {/* Chapter Overlay Badge */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-950/60 to-cyan-950/60 border border-violet-500/30 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      {chapters[activeChapter].title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Step {activeChapter + 1} of 4
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Central Play/Pause Watermark Overlay when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
              aria-label="Play video"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}
        </div>

        {/* Custom Playback Scrubber & Controls Bar */}
        <div className="bg-[#121317] border-t border-white/5 px-6 py-3.5 flex flex-col gap-2">
          {/* Timeline Scrubber */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="w-full h-2 rounded-full bg-white/10 hover:h-2.5 transition-all cursor-pointer relative group/timeline"
          >
            {/* Filled Progress */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md scale-0 group-hover/timeline:scale-100 transition-transform" />
            </div>

            {/* Chapter Markers */}
            {chapters.map((ch, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 hover:bg-cyan-400 transition-colors"
                style={{ left: `${(ch.start / duration) * 100}%` }}
                title={ch.title}
              />
            ))}
          </div>

          {/* Controls Strip */}
          <div className="flex items-center justify-between text-slate-300 text-xs">
            {/* Left Controls: Play, Time */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="font-mono text-[11px] text-slate-400">
                <span className="text-white font-medium">{formatTime(currentTime)}</span> / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls: Volume, Speed, Fullscreen */}
            <div className="flex items-center gap-4">
              {/* Volume Slider */}
              <div className="flex items-center gap-2 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-cyan-400 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Playback Speed selector */}
              <button
                onClick={() => {
                  const speeds = [1, 1.25, 1.5, 2];
                  const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                  setPlaybackSpeed(next);
                  if (videoRef.current) videoRef.current.playbackRate = next;
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-cyan-400 font-semibold cursor-pointer"
              >
                {playbackSpeed}x
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

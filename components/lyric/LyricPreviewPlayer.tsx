"use client";
import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSec } from "@/lib/formatTime";
import { useAudioSync } from "@/hooks/useAudioSync";
import { useActiveLyricLine } from "@/hooks/useActiveLyricLine";
import type { LyricLine } from "./LyricLineRow";

interface LyricPreviewPlayerProps {
  audioUrl?: string;
  videoUrl?: string;
  lines: LyricLine[];
  lyricStyle?: string;
  onTimeUpdate?: (ms: number) => void;
}

export function LyricPreviewPlayer({
  audioUrl,
  videoUrl,
  lines,
  lyricStyle = "fade-in",
  onTimeUpdate,
}: LyricPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  const { isPlaying, currentMs, duration, toggle, seek } = useAudioSync(audioRef, videoRef);
  const activeLine = useActiveLyricLine(lines, currentMs);

  useEffect(() => {
    onTimeUpdate?.(currentMs);
  }, [currentMs, onTimeUpdate]);

  const progress = duration > 0 ? (currentMs / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-0 rounded-card overflow-hidden border border-studio-border bg-studio-surface">
      {/* Video / background area */}
      <div className="relative aspect-video bg-studio-bg flex items-center justify-center">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            loop
            playsInline
          />
        ) : (
          <div className="absolute inset-0 bg-surface-gradient" />
        )}

        {/* Ambient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

        {/* Lyric display */}
        {activeLine && (
          <div
            key={activeLine.id}
            className={cn(
              "absolute bottom-10 left-0 right-0 px-8 text-center",
              lyricStyle === "cinematic-center" && "top-1/2 -translate-y-1/2 bottom-auto",
              lyricStyle === "lower-third" && "bottom-4"
            )}
          >
            <p
              className={cn(
                "text-white font-bold leading-tight drop-shadow-lg",
                activeLine.emphasis ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
                lyricStyle === "fade-in" && "animate-fade-in",
                lyricStyle === "slide-up" && "animate-slide-up",
                lyricStyle === "word-glow" && "animate-pulse-glow text-shadow-glow",
                lyricStyle === "beat-pulse" && "animate-pulse"
              )}
            >
              {activeLine.text}
            </p>
          </div>
        )}

        {/* Click to play */}
        {!audioUrl && !videoUrl && (
          <p className="text-xs text-ink-muted">Upload audio to enable preview</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 px-4 py-3 bg-studio-elevated">
        {/* Progress bar */}
        <div
          className="group relative h-1 w-full cursor-pointer rounded-full bg-studio-border"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const fraction = (e.clientX - rect.left) / rect.width;
            seek(fraction * duration);
          }}
        >
          <div
            className="h-full rounded-full bg-accent-gradient transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Buttons + time */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            disabled={!audioUrl}
            className="text-ink-primary"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <span className="text-xs font-mono text-ink-muted tabular-nums">
            {formatSec(currentMs / 1000)} / {formatSec(duration / 1000)}
          </span>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setMuted(!muted);
              if (audioRef.current) audioRef.current.muted = !muted;
            }}
            className="text-ink-muted"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Hidden audio element — master sync source */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}
    </div>
  );
}

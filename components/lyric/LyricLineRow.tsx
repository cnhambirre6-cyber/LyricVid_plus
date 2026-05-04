"use client";
import { useState } from "react";
import { GripVertical, Trash2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMs, parseTimeInput } from "@/lib/formatTime";

export interface LyricLine {
  id: string;
  order: number;
  text: string;
  startMs: number;
  endMs?: number;
  emphasis?: boolean;
}

interface LyricLineRowProps {
  line: LyricLine;
  isActive: boolean;
  onChange: (id: string, updates: Partial<LyricLine>) => void;
  onDelete: (id: string) => void;
  onStamp?: (id: string) => void;
}

export function LyricLineRow({ line, isActive, onChange, onDelete, onStamp }: LyricLineRowProps) {
  const [startInput, setStartInput] = useState(formatMs(line.startMs));
  const [startError, setStartError] = useState(false);

  const commitStart = () => {
    const ms = parseTimeInput(startInput);
    if (ms !== null) {
      onChange(line.id, { startMs: ms });
      setStartError(false);
      setStartInput(formatMs(ms));
    } else {
      setStartError(true);
      setStartInput(formatMs(line.startMs));
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-studio px-3 py-2.5 transition-all duration-150",
        isActive
          ? "bg-accent-muted border border-accent/30"
          : "bg-studio-surface border border-studio-border hover:border-studio-ring"
      )}
    >
      {/* Drag handle */}
      <GripVertical className="h-4 w-4 shrink-0 text-ink-muted cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-100" />

      {/* Start time */}
      <div className="flex items-center gap-1 shrink-0">
        <input
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          onBlur={commitStart}
          onKeyDown={(e) => e.key === "Enter" && commitStart()}
          className={cn(
            "w-16 rounded bg-studio-elevated border px-1.5 py-0.5 text-center text-xs font-mono text-ink-secondary transition-colors",
            startError ? "border-status-failed" : "border-studio-border focus:border-accent-glow"
          )}
        />
        {onStamp && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onStamp(line.id)}
            title="Stamp current audio time"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Clock className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Text */}
      <input
        value={line.text}
        onChange={(e) => onChange(line.id, { text: e.target.value })}
        className={cn(
          "flex-1 bg-transparent text-sm outline-none text-ink-primary placeholder:text-ink-muted",
          isActive && "font-medium"
        )}
        placeholder="Lyric line…"
      />

      {/* Emphasis toggle */}
      <button
        type="button"
        onClick={() => onChange(line.id, { emphasis: !line.emphasis })}
        className={cn(
          "shrink-0 text-xs px-2 py-0.5 rounded transition-colors",
          line.emphasis
            ? "bg-accent-muted text-ink-accent"
            : "text-ink-muted hover:text-ink-secondary"
        )}
        title="Toggle emphasis"
      >
        ★
      </button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(line.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-ink-muted hover:text-status-failed transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

"use client";
import { useCallback } from "react";
import { Plus, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LyricLineRow, type LyricLine } from "./LyricLineRow";

interface LyricsTimelineEditorProps {
  lines: LyricLine[];
  activeLineId?: string;
  currentMs?: number;
  onChangeLines: (lines: LyricLine[]) => void;
  onStampLine?: (id: string, ms: number) => void;
}

export function LyricsTimelineEditor({
  lines,
  activeLineId,
  currentMs = 0,
  onChangeLines,
  onStampLine,
}: LyricsTimelineEditorProps) {
  const handleChange = useCallback(
    (id: string, updates: Partial<LyricLine>) => {
      onChangeLines(lines.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    },
    [lines, onChangeLines]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChangeLines(lines.filter((l) => l.id !== id));
    },
    [lines, onChangeLines]
  );

  const addLine = () => {
    const lastMs = lines[lines.length - 1]?.startMs ?? 0;
    const newLine: LyricLine = {
      id: crypto.randomUUID(),
      order: lines.length,
      text: "",
      startMs: lastMs + 3000,
    };
    onChangeLines([...lines, newLine]);
  };

  const handleStamp = (id: string) => {
    onStampLine?.(id, currentMs);
    handleChange(id, { startMs: currentMs });
  };

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-studio-border bg-studio-surface py-10 text-center">
        <ListMusic className="h-8 w-8 text-ink-muted opacity-50" />
        <p className="text-sm text-ink-secondary">No lyric lines yet</p>
        <p className="text-xs text-ink-muted">Import from the lyrics editor or add lines manually</p>
        <Button variant="outline" size="sm" onClick={addLine}>
          <Plus className="h-4 w-4" />
          Add line
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">{lines.length} lines</span>
        <Button variant="ghost" size="sm" onClick={addLine}>
          <Plus className="h-3.5 w-3.5" />
          Add line
        </Button>
      </div>
      <div className="flex flex-col gap-1 max-h-[420px] overflow-y-auto pr-1">
        {[...lines]
          .sort((a, b) => a.startMs - b.startMs)
          .map((line) => (
            <LyricLineRow
              key={line.id}
              line={line}
              isActive={line.id === activeLineId}
              onChange={handleChange}
              onDelete={handleDelete}
              onStamp={onStampLine ? handleStamp : undefined}
            />
          ))}
      </div>
    </div>
  );
}

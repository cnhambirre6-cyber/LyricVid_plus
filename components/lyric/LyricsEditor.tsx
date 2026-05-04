"use client";
import { useState } from "react";
import { FileText, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { parseLyrics, type ParsedLine } from "@/lib/parseLyrics";

interface LyricsEditorProps {
  value: string;
  onChange: (raw: string) => void;
  onImportLines?: (lines: ParsedLine[]) => void;
}

export function LyricsEditor({ value, onChange, onImportLines }: LyricsEditorProps) {
  const [showHelp, setShowHelp] = useState(false);

  const handleImport = () => {
    const lines = parseLyrics(value);
    onImportLines?.(lines);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-primary">Lyrics</span>
        </div>
        <button
          type="button"
          className="text-xs text-ink-muted hover:text-ink-secondary transition-colors"
          onClick={() => setShowHelp(!showHelp)}
        >
          {showHelp ? "Hide" : "LRC format?"}
        </button>
      </div>

      {showHelp && (
        <div className="rounded-studio bg-studio-elevated border border-studio-border p-3 text-xs text-ink-secondary leading-relaxed">
          <p className="font-medium text-ink-primary mb-1">LRC timestamp format</p>
          <code className="text-ink-accent">[01:23.45] Line of lyrics here</code>
          <p className="mt-1">Paste LRC to auto-import timestamps, or paste plain lyrics and add timing manually.</p>
        </div>
      )}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Paste lyrics here...\n\nTip: LRC format with [01:23.45] timestamps will auto-import timing."}
        className="min-h-[200px] font-mono text-xs"
      />

      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{value.split("\n").filter(Boolean).length} lines</span>
        {onImportLines && value.trim() && (
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Wand2 className="h-3.5 w-3.5" />
            Import to timeline
          </Button>
        )}
      </div>
    </div>
  );
}

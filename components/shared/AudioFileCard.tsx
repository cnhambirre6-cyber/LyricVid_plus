"use client";
import { Music, Trash2, Clock, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSec, formatBytes } from "@/lib/formatTime";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface AudioFileCardProps {
  projectId: Id<"projects">;
  fileName: string;
  durationMs?: number;
  fileSize?: number;
}

export function AudioFileCard({ projectId, fileName, durationMs, fileSize }: AudioFileCardProps) {
  const removeAudio = useMutation(api.projects.removeAudio);

  return (
    <div className="flex items-center gap-3 rounded-studio bg-studio-elevated border border-studio-border px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-muted">
        <Music className="h-4 w-4 text-ink-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-ink-primary">{fileName}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {durationMs !== undefined && durationMs > 0 && (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Clock className="h-3 w-3" />
              {formatSec(durationMs / 1000)}
            </span>
          )}
          {fileSize !== undefined && fileSize > 0 && (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <HardDrive className="h-3 w-3" />
              {formatBytes(fileSize)}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-ink-muted hover:text-status-failed"
        onClick={() => removeAudio({ id: projectId })}
        title="Remove audio"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

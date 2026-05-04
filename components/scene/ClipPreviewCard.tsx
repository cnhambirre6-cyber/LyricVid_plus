"use client";
import { Play, RefreshCw, Download, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerationStatusBadge } from "@/components/shared/GenerationStatusBadge";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

type SceneStatus = "draft" | "queued" | "generating" | "ready" | "failed";

interface ClipPreviewCardProps {
  sceneId: Id<"scenes">;
  title?: string;
  order: number;
  status: SceneStatus;
  clipUrl?: string;
  isSelected?: boolean;
  onSelect?: () => void;
  onRegenerate?: () => void;
}

export function ClipPreviewCard({
  sceneId,
  title,
  order,
  status,
  clipUrl,
  isSelected,
  onSelect,
  onRegenerate,
}: ClipPreviewCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-card border overflow-hidden cursor-pointer transition-all duration-200",
        isSelected
          ? "border-accent/60 shadow-glow-sm"
          : "border-studio-border hover:border-studio-ring"
      )}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-studio-bg">
        {clipUrl ? (
          <video
            src={clipUrl}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-gradient">
            <Film className="h-8 w-8 text-ink-muted opacity-30" />
          </div>
        )}

        {/* Scene number badge */}
        <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white">
          {order + 1}
        </div>

        {/* Play overlay on hover */}
        {clipUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Status */}
        <div className="absolute bottom-2 right-2">
          <GenerationStatusBadge status={status} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 bg-studio-elevated px-3 py-2">
        <p className="truncate text-xs font-medium text-ink-primary">
          {title ?? `Scene ${order + 1}`}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {clipUrl && (
            <Button
              variant="ghost"
              size="icon-sm"
              asChild
              onClick={(e) => e.stopPropagation()}
              title="Download clip"
            >
              <a href={clipUrl} download target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {onRegenerate && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
              title="Regenerate clip"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { Music2, Film, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GenerationStatusBadge } from "@/components/shared/GenerationStatusBadge";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  id: Id<"projects">;
  title: string;
  type: "lyricVideo" | "sceneProject";
  status: "draft" | "queued" | "generating" | "ready" | "failed";
  createdAt: number;
  audioFileName?: string;
}

export function ProjectCard({ id, title, type, status, createdAt, audioFileName }: ProjectCardProps) {
  const removeProject = useMutation(api.projects.remove);
  const href = type === "lyricVideo" ? `/projects/${id}/lyric` : `/projects/${id}/scene`;

  return (
    <Card className="group relative overflow-hidden hover:border-studio-ring transition-all duration-200 hover:-translate-y-0.5">
      <Link href={href} className="block">
        {/* Thumbnail area */}
        <div className="relative h-36 bg-surface-gradient overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {type === "lyricVideo" ? (
              <Music2 className="h-10 w-10 text-ink-muted opacity-30" />
            ) : (
              <Film className="h-10 w-10 text-ink-muted opacity-30" />
            )}
          </div>
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute bottom-3 left-3">
            <GenerationStatusBadge status={status} />
          </div>
        </div>

        <CardContent className="pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink-primary">{title}</h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                {type === "lyricVideo" ? "Lyric Video" : "Scene Project"}
                {" · "}
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          {audioFileName && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              <Music2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{audioFileName}</span>
            </p>
          )}
        </CardContent>
      </Link>

      {/* Delete action */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-status-failed/20 hover:text-status-failed text-white transition-all z-10"
        onClick={(e) => {
          e.preventDefault();
          if (confirm(`Delete "${title}"?`)) removeProject({ id });
        }}
        title="Delete project"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </Card>
  );
}

"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { DashboardHero } from "@/components/studio/DashboardHero";
import { ProjectCard } from "@/components/studio/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Music2, Film } from "lucide-react";

export function DashboardClient() {
  const allProjects = useQuery(api.projects.list, {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lyricProjects = (allProjects as any[])?.filter((p: any) => p.type === "lyricVideo") ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sceneProjects = (allProjects as any[])?.filter((p: any) => p.type === "sceneProject") ?? [];

  return (
    <div className="min-h-screen bg-studio-bg">
      <StudioHeader />

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        <DashboardHero />

        {/* Lyric Videos */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Music2 className="h-4 w-4 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink-primary">Lyric Videos</h2>
            {lyricProjects.length > 0 && (
              <span className="text-xs text-ink-muted">({lyricProjects.length})</span>
            )}
          </div>

          {allProjects === undefined ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-card" />
              ))}
            </div>
          ) : lyricProjects.length === 0 ? (
            <div className="flex items-center gap-3 rounded-card border border-dashed border-studio-border bg-studio-surface px-6 py-5 text-sm text-ink-muted">
              <Music2 className="h-5 w-5 shrink-0 opacity-40" />
              <span>No lyric video projects yet — create one from the top.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {lyricProjects.map((p) => (
                <ProjectCard
                  key={p._id}
                  id={p._id}
                  title={p.title}
                  type={p.type}
                  status={p.status}
                  createdAt={p.createdAt}
                  audioFileName={p.audioFileName}
                />
              ))}
            </div>
          )}
        </section>

        {/* Scene Projects */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Film className="h-4 w-4 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink-primary">Scene Projects</h2>
            {sceneProjects.length > 0 && (
              <span className="text-xs text-ink-muted">({sceneProjects.length})</span>
            )}
          </div>

          {allProjects === undefined ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-card" />
              ))}
            </div>
          ) : sceneProjects.length === 0 ? (
            <div className="flex items-center gap-3 rounded-card border border-dashed border-studio-border bg-studio-surface px-6 py-5 text-sm text-ink-muted">
              <Film className="h-5 w-5 shrink-0 opacity-40" />
              <span>No scene projects yet — build your first music video scene by scene.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sceneProjects.map((p) => (
                <ProjectCard
                  key={p._id}
                  id={p._id}
                  title={p.title}
                  type={p.type}
                  status={p.status}
                  createdAt={p.createdAt}
                  audioFileName={p.audioFileName}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

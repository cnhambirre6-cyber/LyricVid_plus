import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music2, Film, ArrowRight } from "lucide-react";

export function DashboardHero() {
  return (
    <section className="relative overflow-hidden rounded-xl2 bg-surface-gradient border border-studio-border px-8 py-12">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-hero-gradient" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-accent">AI Music Video Studio</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink-primary md:text-4xl">
            Turn your song into<br />
            <span className="text-gradient">a visual story.</span>
          </h1>
          <p className="max-w-md text-sm text-ink-secondary leading-relaxed">
            Generate lyric videos with synchronized lyrics and AI visuals, or build scene-by-scene music videos with custom characters.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" size="lg" asChild>
            <Link href="/create?type=lyricVideo">
              <Music2 className="h-4 w-4" />
              Lyric Video
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/create?type=sceneProject">
              <Film className="h-4 w-4" />
              Scene Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="relative mt-10 flex items-center gap-8 border-t border-studio-border pt-6">
        {[
          { label: "Sync every lyric line", sub: "Frame-accurate timing editor" },
          { label: "Build scene by scene", sub: "Storyboard + character system" },
          { label: "One-click final export", sub: "Full song as master audio" },
        ].map((item) => (
          <div key={item.label} className="flex-1">
            <p className="text-xs font-semibold text-ink-primary">{item.label}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

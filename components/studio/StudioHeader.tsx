"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudioHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export function StudioHeader({ title, showBack, backHref = "/", actions }: StudioHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-studio-border bg-studio-bg/80 px-6 backdrop-blur-md">
      {/* Wordmark */}
      <Link href="/" className="flex items-center gap-2 shrink-0 group">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-gradient shadow-glow-sm group-hover:shadow-glow transition-all duration-200">
          <Clapperboard className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-gradient">LirycVid+</span>
      </Link>

      {/* Separator + contextual title */}
      {title && (
        <>
          <span className="text-studio-border text-lg select-none">/</span>
          <span className="text-sm font-medium text-ink-secondary truncate">{title}</span>
        </>
      )}

      <div className="flex-1" />

      {/* Nav actions */}
      <nav className="flex items-center gap-2">
        {actions}
        {!isHome && (
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {isHome && (
          <Button variant="primary" size="sm" asChild>
            <Link href="/create">
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </Button>
        )}
      </nav>
    </header>
  );
}

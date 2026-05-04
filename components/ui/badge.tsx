import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        draft:      "bg-ink-muted/20 text-ink-muted",
        queued:     "bg-status-queued/15 text-status-queued",
        generating: "bg-status-generating/15 text-status-generating",
        ready:      "bg-status-ready/15 text-status-ready",
        failed:     "bg-status-failed/15 text-status-failed",
        accent:     "bg-accent-muted text-ink-accent",
        surface:    "bg-studio-elevated border border-studio-border text-ink-secondary",
      },
    },
    defaultVariants: { variant: "surface" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-ink-muted":         variant === "draft",
            "bg-status-queued":     variant === "queued",
            "bg-status-generating animate-pulse": variant === "generating",
            "bg-status-ready":      variant === "ready",
            "bg-status-failed":     variant === "failed",
            "bg-accent-glow":       variant === "accent",
          })}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };

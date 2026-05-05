import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// "running" is the internal job/scene status; "generating" is the project-level status.
// Both render identically — the badge variant stays "generating" for both.
export type GenerationStatusValue =
  | "draft"
  | "queued"
  | "running"
  | "generating"
  | "ready"
  | "failed";

const labels: Record<GenerationStatusValue, string> = {
  draft:      "Draft",
  queued:     "Queued",
  running:    "Generating",
  generating: "Generating",
  ready:      "Ready",
  failed:     "Failed",
};

export function GenerationStatusBadge({ status }: { status: GenerationStatusValue }) {
  const isActive = status === "running" || status === "generating";
  const variant = isActive ? "generating" : (status as "draft" | "queued" | "ready" | "failed");

  return (
    <Badge variant={variant} dot={!isActive}>
      {isActive && <Loader2 className="h-3 w-3 animate-spin" />}
      {labels[status]}
    </Badge>
  );
}

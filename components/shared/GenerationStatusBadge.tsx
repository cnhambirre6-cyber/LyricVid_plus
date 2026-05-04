import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Status = "draft" | "queued" | "generating" | "ready" | "failed";

const labels: Record<Status, string> = {
  draft:      "Draft",
  queued:     "Queued",
  generating: "Generating",
  ready:      "Ready",
  failed:     "Failed",
};

export function GenerationStatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={status} dot={status !== "generating"}>
      {status === "generating" && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {labels[status]}
    </Badge>
  );
}

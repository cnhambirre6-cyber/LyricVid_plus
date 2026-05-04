"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type SceneStatus = "draft" | "queued" | "generating" | "ready" | "failed";

interface SceneGenerationStatus {
  status: SceneStatus;
  clipUrl?: string;
  isActive: boolean;
}

/**
 * Derives the current generation status for a scene.
 * Polls automatically via Convex real-time subscriptions.
 */
export function useSceneGenerationStatus(
  sceneId: Id<"scenes"> | undefined
): SceneGenerationStatus {
  const latestJob = useQuery(
    api.generationJobs.getLatestForScene,
    sceneId ? { sceneId } : "skip"
  );

  if (!sceneId || latestJob === undefined) {
    return { status: "draft", isActive: false };
  }

  const isActive = latestJob?.status === "queued" || latestJob?.status === "generating";

  return {
    status: (latestJob?.status as SceneStatus) ?? "draft",
    clipUrl: latestJob?.outputUrl,
    isActive: isActive ?? false,
  };
}

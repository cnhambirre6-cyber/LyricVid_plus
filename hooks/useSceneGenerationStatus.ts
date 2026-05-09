"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type SceneGenerationStatus = "draft" | "queued" | "running" | "ready" | "failed";

interface SceneGenerationResult {
  generationStatus: SceneGenerationStatus;
  clipVideoUrl?: string;
  isActive: boolean;
}

export function useSceneGenerationStatus(
  sceneId: Id<"scenes"> | undefined
): SceneGenerationResult {
  const latestJob = useQuery(
    api.generationJobs.getLatestForScene,
    sceneId ? { sceneId } : "skip"
  );

  if (!sceneId || latestJob === undefined) {
    return { generationStatus: "draft", isActive: false };
  }

  const isActive =
    latestJob?.status === "queued" || latestJob?.status === "running";

  return {
    generationStatus: (latestJob?.status as SceneGenerationStatus) ?? "draft",
    clipVideoUrl: latestJob?.outputSnapshot?.url,
    isActive: isActive ?? false,
  };
}

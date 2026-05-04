import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const projectStatus = v.union(
  v.literal("draft"),
  v.literal("queued"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed")
);

const sceneStatus = v.union(
  v.literal("draft"),
  v.literal("queued"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed")
);

export default defineSchema({
  projects: defineTable({
    title: v.string(),
    type: v.union(v.literal("lyricVideo"), v.literal("sceneProject")),
    status: projectStatus,
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
    audioStorageId: v.optional(v.id("_storage")),
    audioFileName: v.optional(v.string()),
    audioDurationMs: v.optional(v.number()),
    rawLyrics: v.optional(v.string()),
    lyricStylePreset: v.optional(v.string()),
    backgroundPrompt: v.optional(v.string()),
    generatedVideoStorageId: v.optional(v.id("_storage")),
    generatedVideoUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
    finalVideoStorageId: v.optional(v.id("_storage")),
    finalVideoUrl: v.optional(v.string()),
    stitchStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("stitching"),
        v.literal("done"),
        v.literal("failed")
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  lyricTimingLines: defineTable({
    projectId: v.id("projects"),
    order: v.number(),
    text: v.string(),
    startMs: v.number(),
    endMs: v.optional(v.number()),
    emphasis: v.optional(v.boolean()),
    displayStyle: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_order", ["projectId", "order"]),

  characters: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    personaNotes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  scenes: defineTable({
    projectId: v.id("projects"),
    order: v.number(),
    title: v.optional(v.string()),
    description: v.string(),
    assignedCharacterId: v.optional(v.id("characters")),
    targetDurationSec: v.optional(v.number()),
    mood: v.optional(v.string()),
    style: v.optional(v.string()),
    cinematicDirection: v.optional(v.string()),
    promptPreview: v.optional(v.string()),
    status: sceneStatus,
    clipStorageId: v.optional(v.id("_storage")),
    clipUrl: v.optional(v.string()),
    clipThumbnailUrl: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_order", ["projectId", "order"]),

  generationJobs: defineTable({
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    type: v.union(
      v.literal("lyricVideo"),
      v.literal("sceneClip"),
      v.literal("videoStitch"),
      v.literal("backgroundImage")
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed")
    ),
    provider: v.optional(v.string()),
    providerJobId: v.optional(v.string()),
    outputUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_scene", ["sceneId"])
    .index("by_status", ["status"]),
});

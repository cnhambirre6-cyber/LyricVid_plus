import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Shared validator for any generation-aware status field
const generationStatus = v.union(
  v.literal("draft"),
  v.literal("queued"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed")
);

// Top-level project status keeps "generating" for backward UI compat
const projectStatus = v.union(
  v.literal("draft"),
  v.literal("queued"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed")
);

const stitchStatus = v.union(
  v.literal("pending"),
  v.literal("stitching"),
  v.literal("done"),
  v.literal("failed")
);

export default defineSchema({
  // ── Shared project record ──────────────────────────────────────────────────
  // Contains only fields common to both project types.
  // Type-specific data lives in lyricVideoProjects / sceneProjects (1:1).
  projects: defineTable({
    title: v.string(),
    type: v.union(v.literal("lyricVideo"), v.literal("sceneProject")),
    status: projectStatus,
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
    // Audio file stored in Convex File Storage
    audioStorageId: v.optional(v.id("_storage")),
    audioFileName: v.optional(v.string()),
    audioMimeType: v.optional(v.string()),
    audioFileSize: v.optional(v.number()),
    audioDurationMs: v.optional(v.number()),
    audioUploadedAt: v.optional(v.number()),
    // Cached URL set from the first generated asset — used for dashboard thumbnails
    coverImageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"])
    // Supports list-by-type queries sorted by recency
    .index("by_type_createdAt", ["type", "createdAt"]),

  // ── Lyric video satellite (1:1 with projects where type = "lyricVideo") ───
  lyricVideoProjects: defineTable({
    projectId: v.id("projects"),
    rawLyrics: v.optional(v.string()),
    lyricStylePreset: v.optional(v.string()),
    backgroundPrompt: v.optional(v.string()),
    // Extensible blob: model params, seed, negative prompt overrides, etc.
    visualGenerationSettings: v.optional(v.any()),
    generatedVideoUrl: v.optional(v.string()),
    generatedVideoStorageId: v.optional(v.id("_storage")),
    previewVideoUrl: v.optional(v.string()),
    generationStatus: generationStatus,
    lastSyncedAt: v.optional(v.number()),
  }).index("by_project", ["projectId"]),

  // ── Scene project satellite (1:1 with projects where type = "sceneProject") ─
  sceneProjects: defineTable({
    projectId: v.id("projects"),
    summary: v.optional(v.string()),
    // Raw lyrics text — used as visual fallback when a scene has no description
    rawLyrics: v.optional(v.string()),
    stitchStatus: stitchStatus,
    finalVideoUrl: v.optional(v.string()),
    finalVideoStorageId: v.optional(v.id("_storage")),
    finalVideoDurationMs: v.optional(v.number()),
    // Extensible blob: clip order overrides, transition config, etc.
    assemblyMetadata: v.optional(v.any()),
  }).index("by_project", ["projectId"]),

  // ── Lyric timing lines ─────────────────────────────────────────────────────
  lyricTimingLines: defineTable({
    projectId: v.id("projects"),
    order: v.number(),
    text: v.string(),
    startMs: v.number(),
    endMs: v.optional(v.number()),
    // String rather than boolean: "bold" | "italic" | "glow" | etc.
    emphasisStyle: v.optional(v.string()),
    animationPreset: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_order", ["projectId", "order"]),

  // ── Characters ─────────────────────────────────────────────────────────────
  characters: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    styleNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  // ── Scenes ─────────────────────────────────────────────────────────────────
  scenes: defineTable({
    projectId: v.id("projects"),
    order: v.number(),
    title: v.optional(v.string()),
    description: v.string(),
    assignedCharacterId: v.optional(v.id("characters")),
    // Stored in ms for unit consistency with audio/lyric timestamps
    targetDurationMs: v.optional(v.number()),
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
    cinematicDirection: v.optional(v.string()),
    promptPreview: v.optional(v.string()),
    generationStatus: generationStatus,
    clipStorageId: v.optional(v.id("_storage")),
    clipVideoUrl: v.optional(v.string()),
    clipThumbnailUrl: v.optional(v.string()),
    providerJobId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    lastGeneratedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_order", ["projectId", "order"]),

  // ── Generation jobs ────────────────────────────────────────────────────────
  generationJobs: defineTable({
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    type: v.union(
      v.literal("lyricBackground"),
      v.literal("sceneClip"),
      v.literal("finalStitch")
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("ready"),
      v.literal("failed")
    ),
    provider: v.optional(v.string()),
    providerJobId: v.optional(v.string()),
    // Input state captured at job creation — enables audit trails and retry
    inputSnapshot: v.optional(v.any()),
    // Full provider response after completion
    outputSnapshot: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_scene", ["sceneId"]),
});

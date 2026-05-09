import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ACCEPTED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
]);
const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50 MB

// ── Queries ────────────────────────────────────────────────────────────────

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const list = query({
  args: { type: v.optional(v.union(v.literal("lyricVideo"), v.literal("sceneProject"))) },
  handler: async (ctx, { type }) => {
    if (type) {
      return ctx.db
        .query("projects")
        .withIndex("by_type", (q) => q.eq("type", type))
        .order("desc")
        .collect();
    }
    return ctx.db.query("projects").withIndex("by_createdAt").order("desc").collect();
  },
});

export const listRecent = query({
  args: {
    type: v.optional(v.union(v.literal("lyricVideo"), v.literal("sceneProject"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type, limit = 20 }) => {
    // by_type_createdAt lets us filter by type and sort by createdAt in one index scan
    const q = type
      ? ctx.db
          .query("projects")
          .withIndex("by_type_createdAt", (q) => q.eq("type", type))
      : ctx.db.query("projects").withIndex("by_createdAt");
    return q.order("desc").take(limit);
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("lyricVideo"), v.literal("sceneProject")),
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      ...args,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    // Create the type-specific satellite record immediately
    if (args.type === "lyricVideo") {
      await ctx.db.insert("lyricVideoProjects", {
        projectId,
        generationStatus: "draft",
      });
    } else {
      await ctx.db.insert("sceneProjects", {
        projectId,
        stitchStatus: "pending",
      });
    }
    return projectId;
  },
});

// Only updates fields that live on the shared projects record
export const updateBasics = mutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const linkAudio = mutation({
  args: {
    id: v.id("projects"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, { id, storageId, fileName, mimeType, fileSize, durationMs }) => {
    if (!ACCEPTED_AUDIO_TYPES.has(mimeType)) {
      throw new Error(`Unsupported audio format: ${mimeType}`);
    }
    if (fileSize > MAX_AUDIO_BYTES) {
      throw new Error(`File size ${fileSize} exceeds the 50 MB limit`);
    }

    // Delete previous audio from storage when replacing
    const project = await ctx.db.get(id);
    if (project?.audioStorageId && project.audioStorageId !== storageId) {
      await ctx.storage.delete(project.audioStorageId);
    }

    const now = Date.now();
    await ctx.db.patch(id, {
      audioStorageId: storageId,
      audioFileName: fileName,
      audioMimeType: mimeType,
      audioFileSize: fileSize,
      audioDurationMs: durationMs,
      audioUploadedAt: now,
      updatedAt: now,
    });
  },
});

export const removeAudio = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const project = await ctx.db.get(id);
    if (project?.audioStorageId) await ctx.storage.delete(project.audioStorageId);
    await ctx.db.patch(id, {
      audioStorageId: undefined,
      audioFileName: undefined,
      audioMimeType: undefined,
      audioFileSize: undefined,
      audioDurationMs: undefined,
      audioUploadedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("projects"),
    status: v.union(
      v.literal("draft"),
      v.literal("queued"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const project = await ctx.db.get(id);
    if (!project) return;

    if (project.audioStorageId) await ctx.storage.delete(project.audioStorageId);

    const lyricProject = await ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .first();
    if (lyricProject) {
      if (lyricProject.generatedVideoStorageId) {
        await ctx.storage.delete(lyricProject.generatedVideoStorageId);
      }
      await ctx.db.delete(lyricProject._id);
    }

    const sceneProject = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .first();
    if (sceneProject) {
      if (sceneProject.finalVideoStorageId) {
        await ctx.storage.delete(sceneProject.finalVideoStorageId);
      }
      await ctx.db.delete(sceneProject._id);
    }

    const lyricLines = await ctx.db
      .query("lyricTimingLines")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    for (const line of lyricLines) await ctx.db.delete(line._id);

    const characters = await ctx.db
      .query("characters")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    for (const char of characters) {
      if (char.imageStorageId) await ctx.storage.delete(char.imageStorageId);
      await ctx.db.delete(char._id);
    }

    const scenes = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    for (const scene of scenes) {
      if (scene.clipStorageId) await ctx.storage.delete(scene.clipStorageId);
      await ctx.db.delete(scene._id);
    }

    const jobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    for (const job of jobs) await ctx.db.delete(job._id);

    await ctx.db.delete(id);
  },
});

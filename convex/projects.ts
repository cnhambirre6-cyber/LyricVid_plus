import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("lyricVideo"), v.literal("sceneProject")),
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("projects", {
      ...args,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBasics = mutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
    summary: v.optional(v.string()),
    rawLyrics: v.optional(v.string()),
    lyricStylePreset: v.optional(v.string()),
    backgroundPrompt: v.optional(v.string()),
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
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, { id, storageId, fileName, durationMs }) => {
    await ctx.db.patch(id, {
      audioStorageId: storageId,
      audioFileName: fileName,
      audioDurationMs: durationMs,
      updatedAt: Date.now(),
    });
  },
});

export const removeAudio = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const project = await ctx.db.get(id);
    if (project?.audioStorageId) {
      await ctx.storage.delete(project.audioStorageId);
    }
    await ctx.db.patch(id, {
      audioStorageId: undefined,
      audioFileName: undefined,
      audioDurationMs: undefined,
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

export const linkGeneratedVideo = mutation({
  args: {
    id: v.id("projects"),
    videoUrl: v.string(),
  },
  handler: async (ctx, { id, videoUrl }) => {
    await ctx.db.patch(id, {
      generatedVideoUrl: videoUrl,
      status: "ready",
      updatedAt: Date.now(),
    });
  },
});

export const linkFinalVideo = mutation({
  args: { id: v.id("projects"), videoUrl: v.string() },
  handler: async (ctx, { id, videoUrl }) => {
    await ctx.db.patch(id, {
      finalVideoUrl: videoUrl,
      stitchStatus: "done",
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const project = await ctx.db.get(id);
    if (project?.audioStorageId) await ctx.storage.delete(project.audioStorageId);
    if (project?.generatedVideoStorageId)
      await ctx.storage.delete(project.generatedVideoStorageId);
    if (project?.finalVideoStorageId) await ctx.storage.delete(project.finalVideoStorageId);

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

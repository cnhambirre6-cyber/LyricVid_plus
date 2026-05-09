import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first(),
});

export const updateContent = mutation({
  args: {
    projectId: v.id("projects"),
    rawLyrics: v.optional(v.string()),
    lyricStylePreset: v.optional(v.string()),
    backgroundPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, ...fields }) => {
    const existing = await ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (existing) await ctx.db.patch(existing._id, fields);
  },
});

export const linkGeneratedVideo = mutation({
  args: {
    projectId: v.id("projects"),
    videoUrl: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { projectId, videoUrl, storageId }) => {
    const existing = await ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, {
      generatedVideoUrl: videoUrl,
      ...(storageId ? { generatedVideoStorageId: storageId } : {}),
      generationStatus: "ready",
    });
    // Also update the cover image on the parent project for dashboard thumbnails
    await ctx.db.patch(projectId, {
      coverImageUrl: videoUrl,
      status: "ready",
      updatedAt: Date.now(),
    });
  },
});

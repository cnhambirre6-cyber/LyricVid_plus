import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const stitchStatus = v.union(
  v.literal("pending"),
  v.literal("stitching"),
  v.literal("done"),
  v.literal("failed")
);

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first(),
});

export const updateSummary = mutation({
  args: { projectId: v.id("projects"), summary: v.string() },
  handler: async (ctx, { projectId, summary }) => {
    const existing = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { summary });
  },
});

export const setStitchStatus = mutation({
  args: { projectId: v.id("projects"), stitchStatus },
  handler: async (ctx, { projectId, stitchStatus }) => {
    const existing = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { stitchStatus });
  },
});

export const linkFinalVideo = mutation({
  args: {
    projectId: v.id("projects"),
    videoUrl: v.string(),
    storageId: v.optional(v.id("_storage")),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, videoUrl, storageId, durationMs }) => {
    const existing = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, {
      finalVideoUrl: videoUrl,
      stitchStatus: "done",
      ...(storageId ? { finalVideoStorageId: storageId } : {}),
      ...(durationMs !== undefined ? { finalVideoDurationMs: durationMs } : {}),
    });
    await ctx.db.patch(projectId, { status: "ready", updatedAt: Date.now() });
  },
});

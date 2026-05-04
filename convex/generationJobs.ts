import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("generationJobs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect(),
});

export const getLatestForScene = query({
  args: { sceneId: v.id("scenes") },
  handler: async (ctx, { sceneId }) =>
    ctx.db
      .query("generationJobs")
      .withIndex("by_scene", (q) => q.eq("sceneId", sceneId))
      .order("desc")
      .first(),
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    type: v.union(
      v.literal("lyricVideo"),
      v.literal("sceneClip"),
      v.literal("videoStitch"),
      v.literal("backgroundImage")
    ),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("generationJobs", {
      ...args,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("generationJobs"),
    status: v.union(
      v.literal("queued"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed")
    ),
    providerJobId: v.optional(v.string()),
    outputUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) =>
    ctx.db.patch(id, { ...fields, updatedAt: Date.now() }),
});

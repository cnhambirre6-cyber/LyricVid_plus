import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const jobStatus = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("ready"),
  v.literal("failed")
);

const jobType = v.union(
  v.literal("lyricBackground"),
  v.literal("sceneClip"),
  v.literal("finalStitch")
);

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
    type: jobType,
    provider: v.optional(v.string()),
    inputSnapshot: v.optional(v.any()),
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
    status: jobStatus,
    providerJobId: v.optional(v.string()),
    outputSnapshot: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) =>
    ctx.db.patch(id, { ...fields, updatedAt: Date.now() }),
});

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

// ── Queries ────────────────────────────────────────────────────────────────

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

// ── Base mutations ─────────────────────────────────────────────────────────

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

// ── Atomic mark* helpers ───────────────────────────────────────────────────
// Each helper updates both the job record and the affected entity in one mutation,
// eliminating the two-step updateStatus + setGenerationStatus pattern in actions.

export const markSceneGenerationStarted = mutation({
  args: {
    jobId: v.id("generationJobs"),
    sceneId: v.id("scenes"),
    providerJobId: v.optional(v.string()),
    inputSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, { jobId, sceneId, providerJobId, inputSnapshot }) => {
    const now = Date.now();
    await ctx.db.patch(jobId, {
      status: "running",
      updatedAt: now,
      ...(providerJobId ? { providerJobId } : {}),
      ...(inputSnapshot !== undefined ? { inputSnapshot } : {}),
    });
    await ctx.db.patch(sceneId, { generationStatus: "generating", errorMessage: undefined });
  },
});

export const markSceneGenerationCompleted = mutation({
  args: {
    jobId: v.id("generationJobs"),
    sceneId: v.id("scenes"),
    clipVideoUrl: v.string(),
    outputSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, { jobId, sceneId, clipVideoUrl, outputSnapshot }) => {
    const now = Date.now();
    await ctx.db.patch(jobId, {
      status: "ready",
      outputSnapshot: outputSnapshot ?? { url: clipVideoUrl },
      updatedAt: now,
    });
    await ctx.db.patch(sceneId, {
      generationStatus: "ready",
      clipVideoUrl,
      lastGeneratedAt: now,
    });
  },
});

export const markSceneGenerationFailed = mutation({
  args: {
    jobId: v.id("generationJobs"),
    sceneId: v.id("scenes"),
    errorMessage: v.string(),
  },
  handler: async (ctx, { jobId, sceneId, errorMessage }) => {
    const now = Date.now();
    await ctx.db.patch(jobId, { status: "failed", errorMessage, updatedAt: now });
    await ctx.db.patch(sceneId, { generationStatus: "failed", errorMessage });
  },
});

export const markFinalStitchStarted = mutation({
  args: { projectId: v.id("projects"), jobId: v.optional(v.id("generationJobs")) },
  handler: async (ctx, { projectId, jobId }) => {
    const now = Date.now();
    const sp = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (sp) await ctx.db.patch(sp._id, { stitchStatus: "stitching" });
    await ctx.db.patch(projectId, { status: "generating", updatedAt: now });
    if (jobId) await ctx.db.patch(jobId, { status: "running", updatedAt: now });
  },
});

export const markFinalStitchCompleted = mutation({
  args: {
    projectId: v.id("projects"),
    jobId: v.optional(v.id("generationJobs")),
    finalVideoUrl: v.string(),
    durationMs: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { projectId, jobId, finalVideoUrl, durationMs, storageId }) => {
    const now = Date.now();
    const sp = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (sp) {
      await ctx.db.patch(sp._id, {
        stitchStatus: "done",
        finalVideoUrl,
        ...(storageId ? { finalVideoStorageId: storageId } : {}),
        ...(durationMs !== undefined ? { finalVideoDurationMs: durationMs } : {}),
      });
    }
    await ctx.db.patch(projectId, { status: "ready", updatedAt: now });
    if (jobId) {
      await ctx.db.patch(jobId, {
        status: "ready",
        outputSnapshot: { url: finalVideoUrl },
        updatedAt: now,
      });
    }
  },
});

export const markFinalStitchFailed = mutation({
  args: {
    projectId: v.id("projects"),
    jobId: v.optional(v.id("generationJobs")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, jobId, errorMessage }) => {
    const now = Date.now();
    const sp = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (sp) await ctx.db.patch(sp._id, { stitchStatus: "failed" });
    await ctx.db.patch(projectId, { status: "failed", updatedAt: now });
    if (jobId) {
      await ctx.db.patch(jobId, {
        status: "failed",
        ...(errorMessage ? { errorMessage } : {}),
        updatedAt: now,
      });
    }
  },
});

// ── Lyric background helpers ───────────────────────────────────────────────
// Mirrors the scene-clip mark* pattern for the lyric background generation
// flow so all status transitions are atomic across job + lyricVideoProject + project.

export const markLyricBackgroundStarted = mutation({
  args: {
    jobId: v.id("generationJobs"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, { jobId, projectId }) => {
    const now = Date.now();
    await ctx.db.patch(jobId, { status: "running", updatedAt: now });
    const lp = await ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (lp) await ctx.db.patch(lp._id, { generationStatus: "generating" });
    await ctx.db.patch(projectId, { status: "generating", updatedAt: now });
  },
});

export const markLyricBackgroundCompleted = mutation({
  args: {
    jobId: v.id("generationJobs"),
    projectId: v.id("projects"),
    imageUrl: v.string(),
    outputSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, { jobId, projectId, imageUrl, outputSnapshot }) => {
    const now = Date.now();
    await ctx.db.patch(jobId, {
      status: "ready",
      outputSnapshot: outputSnapshot ?? { url: imageUrl },
      updatedAt: now,
    });
    const lp = await ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (lp) {
      await ctx.db.patch(lp._id, {
        generationStatus: "ready",
        generatedVideoUrl: imageUrl,
      });
    }
    await ctx.db.patch(projectId, {
      status: "ready",
      coverImageUrl: imageUrl,
      updatedAt: now,
    });
  },
});

export const markLyricBackgroundFailed = mutation({
  args: {
    jobId: v.id("generationJobs"),
    projectId: v.id("projects"),
    errorMessage: v.string(),
  },
  handler: async (ctx, { jobId, projectId, errorMessage }) => {
    const now = Date.now();
    await ctx.db.patch(jobId, { status: "failed", errorMessage, updatedAt: now });
    const lp = await ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (lp) await ctx.db.patch(lp._id, { generationStatus: "failed" });
    await ctx.db.patch(projectId, { status: "failed", updatedAt: now });
  },
});

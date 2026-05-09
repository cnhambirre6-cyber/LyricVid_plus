import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

// NOTE: setStitchStatus and linkFinalVideo are intentionally omitted.
// All stitch status transitions are handled atomically by the generationJobs
// mark* helpers (markFinalStitchStarted / markFinalStitchCompleted /
// markFinalStitchFailed), which update the job record, sceneProject, and
// parent project in a single mutation to prevent partial-write states.

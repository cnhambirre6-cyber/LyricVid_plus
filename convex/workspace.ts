import { v } from "convex/values";
import { query } from "./_generated/server";

// ── Lyric video workspace ──────────────────────────────────────────────────
// Single subscription that provides everything the lyric workspace page needs:
// project header, audio state (with playable URL), lyrics, ordered timing lines,
// generation status, and the 5 most recent generation jobs.

export const getLyricVideoWorkspace = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const lyricProject = await ctx.db
      .query("lyricVideoProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    const lyricLines = await ctx.db
      .query("lyricTimingLines")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect();

    const audioStorageUrl = project.audioStorageId
      ? await ctx.storage.getUrl(project.audioStorageId)
      : null;

    const recentJobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .take(5);

    return {
      project,
      lyricProject,
      lyricLines,
      audioStorageUrl,
      recentJobs,
    };
  },
});

// ── Scene project workspace ────────────────────────────────────────────────
// Single subscription that provides everything the scene workspace page needs:
// project header, audio state (with playable URL), characters, ordered scenes
// with clip statuses, final output state, and the 10 most recent generation jobs.

export const getSceneProjectWorkspace = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const sceneProject = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    const characters = await ctx.db
      .query("characters")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const scenes = await ctx.db
      .query("scenes")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect();

    const audioStorageUrl = project.audioStorageId
      ? await ctx.storage.getUrl(project.audioStorageId)
      : null;

    const recentJobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .take(10);

    return {
      project,
      sceneProject,
      characters,
      scenes,
      audioStorageUrl,
      recentJobs,
    };
  },
});

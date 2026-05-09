// No "use node" — only uses fetch (Convex V8 runtime)
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// ── Assembly manifest ──────────────────────────────────────────────────────
// Returns ordered clip info for review before stitching.

export const getAssemblyManifest = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const scenes = await ctx.db
      .query("scenes")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect();

    return scenes.map((s) => ({
      sceneId: s._id,
      order: s.order,
      title: s.title ?? null,
      generationStatus: s.generationStatus,
      clipVideoUrl: s.clipVideoUrl ?? null,
      targetDurationMs: s.targetDurationMs ?? null,
    }));
  },
});

// ── Start final stitch ─────────────────────────────────────────────────────
// Validates all scenes are ready, creates a finalStitch job, and marks the
// project as "generating" so the UI shows progress immediately.

export const startFinalStitch = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const scenes = await ctx.db
      .query("scenes")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect();

    if (scenes.length === 0) throw new Error("No scenes to stitch");

    const notReady = scenes.filter((s) => s.generationStatus !== "ready");
    if (notReady.length > 0)
      throw new Error(`${notReady.length} scene(s) are not ready yet`);

    const clipUrls = scenes.map((s) => s.clipVideoUrl).filter((u): u is string => !!u);
    if (clipUrls.length !== scenes.length)
      throw new Error("Some scenes are missing clip URLs");

    const now = Date.now();
    const jobId = await ctx.db.insert("generationJobs", {
      projectId,
      type: "finalStitch",
      status: "queued",
      inputSnapshot: {
        clipUrls,
        sceneCount: scenes.length,
        sceneIds: scenes.map((s) => s._id),
      },
      createdAt: now,
      updatedAt: now,
    });

    const sp = await ctx.db
      .query("sceneProjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (sp) await ctx.db.patch(sp._id, { stitchStatus: "stitching" });

    await ctx.db.patch(projectId, { status: "generating", updatedAt: now });

    return { jobId, clipUrls };
  },
});

// ── Assemble final video ───────────────────────────────────────────────────
// Reads the assembly manifest, calls the stitching service, persists result.

export const assembleFinalVideo = action({
  args: {
    jobId: v.id("generationJobs"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, { jobId, projectId }) => {
    await ctx.runMutation(api.generationJobs.markFinalStitchStarted, {
      projectId,
      jobId,
    });

    try {
      const manifest = await ctx.runQuery(api.sceneAssembly.getAssemblyManifest, {
        projectId,
      });
      const clipUrls = manifest
        .map((s) => s.clipVideoUrl)
        .filter((u): u is string => !!u);

      if (clipUrls.length === 0) throw new Error("No clip URLs found in manifest");

      const finalVideoUrl = await callStitchingService(clipUrls);

      await ctx.runMutation(api.generationJobs.markFinalStitchCompleted, {
        projectId,
        jobId,
        finalVideoUrl,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(api.generationJobs.markFinalStitchFailed, {
        projectId,
        jobId,
        errorMessage,
      });
    }
  },
});

// ── Stitching service stub ─────────────────────────────────────────────────
// Replace this with a real provider call: Mux, Cloudinary, RunPod, or Modal.
// The function receives ordered clip URLs and returns the final video URL.

async function callStitchingService(clipUrls: string[]): Promise<string> {
  // TODO: integrate a real video-stitching provider.
  // Example providers:
  //   • Mux: POST /video/v1/assets with input_streams
  //   • Cloudinary: video concatenation transformation
  //   • RunPod / Modal: custom ffmpeg worker endpoint
  //
  // Placeholder: return the first clip URL until a provider is wired.
  if (clipUrls.length === 0) throw new Error("No clips to stitch");
  return clipUrls[0];
}

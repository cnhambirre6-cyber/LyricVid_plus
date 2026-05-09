import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolves audio fields from a project record into a serialisable AudioRef,
 *  or null when no audio has been uploaded. Storage IDs are never exposed. */
async function resolveAudio(
  ctx: Pick<QueryCtx, "storage">,
  project: {
    audioStorageId?: Id<"_storage">;
    audioFileName?: string;
    audioDurationMs?: number;
    audioFileSize?: number;
    audioMimeType?: string;
  }
) {
  if (!project.audioStorageId || !project.audioFileName) return null;
  const storageUrl = await ctx.storage.getUrl(project.audioStorageId);
  if (!storageUrl) return null;
  return {
    fileName: project.audioFileName,
    durationMs: project.audioDurationMs,
    fileSize: project.audioFileSize,
    mimeType: project.audioMimeType,
    storageUrl,
  };
}

// ─── Lyric video workspace ───────────────────────────────────────────────────
//
// UI areas served:
//   StudioHeader · AudioUploader/AudioFileCard · LyricsEditor
//   LyricsTimelineEditor · LyricPreviewPlayer · StylePresetPicker
//   MoodSelector · Generate-background button · Export/Download button

export const getLyricVideoWorkspace = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const [lyricProject, rawLines, recentJobs] = await Promise.all([
      ctx.db
        .query("lyricVideoProjects")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .first(),
      ctx.db
        .query("lyricTimingLines")
        .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
        .order("asc")
        .collect(),
      ctx.db
        .query("generationJobs")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .order("desc")
        .take(5),
    ]);

    const audio = await resolveAudio(ctx, project);

    const lines = rawLines.map((l) => ({
      _id: l._id,
      order: l.order,
      text: l.text,
      startMs: l.startMs,
      endMs: l.endMs,
      emphasisStyle: l.emphasisStyle,
      animationPreset: l.animationPreset,
    }));

    return {
      // — Identity
      project: {
        _id: project._id,
        title: project.title,
        status: project.status,
        mood: project.mood,
        stylePreset: project.stylePreset,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },

      // — Audio
      audio,

      // — Lyric content
      rawLyrics: lyricProject?.rawLyrics ?? "",
      lines,

      // — Visual style
      lyricStylePreset: lyricProject?.lyricStylePreset,
      backgroundPrompt: lyricProject?.backgroundPrompt,

      // — Generation output
      generationStatus: lyricProject?.generationStatus ?? ("draft" as const),
      generatedVideoUrl: lyricProject?.generatedVideoUrl,
      previewVideoUrl: lyricProject?.previewVideoUrl,

      // — Derived flags
      hasAudio: audio !== null,
      hasTimedLyrics: rawLines.length > 0,

      // — Recent jobs (storage internals stripped)
      recentJobs: recentJobs.map((j) => ({
        _id: j._id,
        type: j.type,
        status: j.status,
        sceneId: j.sceneId,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      })),
    };
  },
});

// ─── Scene project workspace ──────────────────────────────────────────────────
//
// UI areas served:
//   StudioHeader · AudioUploader/AudioFileCard · CharacterManager
//   SceneStoryboard/ClipPreviewCard · SceneEditorPanel · Regenerate buttons
//   Stitch button · Export/Download panel

export const getSceneProjectWorkspace = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const [sceneProject, rawCharacters, rawScenes, recentJobs] = await Promise.all([
      ctx.db
        .query("sceneProjects")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .first(),
      ctx.db
        .query("characters")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect(),
      ctx.db
        .query("scenes")
        .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
        .order("asc")
        .collect(),
      ctx.db
        .query("generationJobs")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .order("desc")
        .take(10),
    ]);

    const audio = await resolveAudio(ctx, project);

    // Build a character-image lookup so per-scene image-to-video eligibility
    // can be annotated without additional per-scene queries.
    const charImageMap = new Map(
      rawCharacters
        .filter((c) => c.imageUrl)
        .map((c) => [c._id.toString(), c.imageUrl as string])
    );

    const characters = rawCharacters.map((c) => ({
      _id: c._id,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
      styleNotes: c.styleNotes,
    }));

    const scenes = rawScenes.map((s) => ({
      _id: s._id,
      order: s.order,
      title: s.title,
      description: s.description,
      generationStatus: s.generationStatus,
      clipVideoUrl: s.clipVideoUrl,
      clipThumbnailUrl: s.clipThumbnailUrl,
      promptPreview: s.promptPreview,
      targetDurationMs: s.targetDurationMs,
      mood: s.mood,
      stylePreset: s.stylePreset,
      cinematicDirection: s.cinematicDirection,
      assignedCharacterId: s.assignedCharacterId,
      errorMessage: s.errorMessage,
      lastGeneratedAt: s.lastGeneratedAt,
      isImageToVideoEligible: !!(
        s.assignedCharacterId && charImageMap.has(s.assignedCharacterId.toString())
      ),
      characterImageUrl: s.assignedCharacterId
        ? (charImageMap.get(s.assignedCharacterId.toString()) ?? null)
        : null,
    }));

    const readySceneCount = scenes.filter((s) => s.generationStatus === "ready").length;
    const hasAudio = audio !== null;
    const hasFinalVideo = !!(sceneProject?.finalVideoUrl);

    return {
      // — Identity
      project: {
        _id: project._id,
        title: project.title,
        status: project.status,
        mood: project.mood,
        stylePreset: project.stylePreset,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },

      // — Audio
      audio,

      // — Cast and scenes
      characters,
      scenes,

      // — Final assembly
      stitchStatus: sceneProject?.stitchStatus ?? ("pending" as const),
      finalVideoUrl: sceneProject?.finalVideoUrl,

      // — Derived flags
      hasAudio,
      hasCharacters: rawCharacters.length > 0,
      readySceneCount,
      canStartStitch: scenes.length > 0 && readySceneCount === scenes.length && hasAudio,
      hasFinalVideo,

      // — Recent jobs (storage internals stripped)
      recentJobs: recentJobs.map((j) => ({
        _id: j._id,
        type: j.type,
        status: j.status,
        sceneId: j.sceneId,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      })),
    };
  },
});

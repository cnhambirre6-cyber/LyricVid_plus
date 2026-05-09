/**
 * Typed payload contracts for the two LirycVid+ workspace queries.
 *
 * These types describe exactly what `getLyricVideoWorkspace` and
 * `getSceneProjectWorkspace` return.  UI components should import these types
 * instead of deriving their own shapes from raw Convex documents.
 *
 * UI coverage:
 *
 *  LyricVideoWorkspace
 *    • StudioHeader (title, status badge)
 *    • AudioUploader / AudioFileCard (audio state)
 *    • LyricsEditor (rawLyrics, lines)
 *    • LyricsTimelineEditor (lines, hasTimedLyrics)
 *    • LyricPreviewPlayer (audio.storageUrl, lines, generatedVideoUrl, lyricStylePreset)
 *    • StylePresetPicker + MoodSelector (lyricStylePreset, project.mood)
 *    • Generate-background button (generationStatus, backgroundPrompt)
 *    • Download button (generatedVideoUrl)
 *
 *  SceneProjectWorkspace
 *    • StudioHeader (title, status badge)
 *    • AudioUploader / AudioFileCard (audio state)
 *    • CharacterManager (characters, hasCharacters)
 *    • SceneStoryboard / ClipPreviewCard (scenes, readySceneCount)
 *    • SceneEditorPanel (scene, characters)
 *    • Regenerate buttons (scene.generationStatus, scene.errorMessage)
 *    • Stitch button (canStartStitch, readySceneCount)
 *    • Export / Download panel (hasFinalVideo, finalVideoUrl)
 */

import type { Id } from "@/convex/_generated/dataModel";

// ─── Shared sub-types ────────────────────────────────────────────────────────

/**
 * Audio file info plus a playable URL resolved from Convex Storage.
 * Null when no audio has been uploaded to the project.
 */
export interface AudioRef {
  fileName: string;
  durationMs?: number;
  fileSize?: number;
  mimeType?: string;
  /** Convex presigned URL — directly usable as <audio src> or <video src>. */
  storageUrl: string;
}

export interface LyricLineRef {
  _id: Id<"lyricTimingLines">;
  order: number;
  text: string;
  startMs: number;
  endMs?: number;
  emphasisStyle?: string;
  animationPreset?: string;
}

export interface CharacterRef {
  _id: Id<"characters">;
  name: string;
  description?: string;
  imageUrl?: string;
  styleNotes?: string;
}

export interface SceneRef {
  _id: Id<"scenes">;
  order: number;
  title?: string;
  description: string;
  generationStatus: GenerationStatus;
  clipVideoUrl?: string;
  clipThumbnailUrl?: string;
  promptPreview?: string;
  targetDurationMs?: number;
  mood?: string;
  stylePreset?: string;
  cinematicDirection?: string;
  assignedCharacterId?: Id<"characters">;
  errorMessage?: string;
  lastGeneratedAt?: number;
  /** True when the assigned character has a reference image for image-to-video routing. */
  isImageToVideoEligible: boolean;
  /** Pre-resolved character image URL — avoids client-side character lookup. */
  characterImageUrl: string | null;
}

export interface RecentJobRef {
  _id: Id<"generationJobs">;
  type: "lyricBackground" | "sceneClip" | "finalStitch";
  status: "queued" | "running" | "ready" | "failed";
  sceneId?: Id<"scenes">;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectMeta {
  _id: Id<"projects">;
  title: string;
  status: ProjectStatus;
  mood?: string;
  stylePreset?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Status literals ─────────────────────────────────────────────────────────

export type GenerationStatus = "draft" | "queued" | "generating" | "ready" | "failed";
export type ProjectStatus = "draft" | "queued" | "generating" | "ready" | "failed";
export type StitchStatus = "pending" | "stitching" | "done" | "failed";

// ─── Workspace payloads ───────────────────────────────────────────────────────

export interface LyricVideoWorkspace {
  // — Identity
  project: ProjectMeta;

  // — Audio (null when no file uploaded)
  audio: AudioRef | null;

  // — Lyric content
  rawLyrics: string;
  lines: LyricLineRef[];

  // — Visual style
  lyricStylePreset?: string;
  backgroundPrompt?: string;

  // — Generation output
  generationStatus: GenerationStatus;
  generatedVideoUrl?: string;
  previewVideoUrl?: string;

  // — Derived flags
  /** True when a valid audio file is attached and its storage URL is resolvable. */
  hasAudio: boolean;
  /** True when at least one lyric timing line exists. */
  hasTimedLyrics: boolean;

  // — Recent job history (last 5)
  recentJobs: RecentJobRef[];
}

export interface SceneProjectWorkspace {
  // — Identity
  project: ProjectMeta;

  // — Audio (null when no file uploaded)
  audio: AudioRef | null;

  // — Cast and scenes
  characters: CharacterRef[];
  scenes: SceneRef[];

  // — Final assembly
  stitchStatus: StitchStatus;
  finalVideoUrl?: string;

  // — Derived flags
  /** True when a valid audio file is attached and its storage URL is resolvable. */
  hasAudio: boolean;
  /** True when at least one character has been created for this project. */
  hasCharacters: boolean;
  /** Number of scenes whose generationStatus is "ready". */
  readySceneCount: number;
  /** True when all scenes are ready AND audio is uploaded — safe to enable the stitch button. */
  canStartStitch: boolean;
  /** True when the final stitched video URL is available for playback / download. */
  hasFinalVideo: boolean;

  // — Recent job history (last 10)
  recentJobs: RecentJobRef[];
}

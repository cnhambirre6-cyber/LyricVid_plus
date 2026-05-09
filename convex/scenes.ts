import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const generationStatus = v.union(
  v.literal("draft"),
  v.literal("queued"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed")
);

// ── Queries ────────────────────────────────────────────────────────────────

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("scenes")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect(),
});

export const get = query({
  args: { id: v.id("scenes") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

// ── Mutations ──────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    order: v.number(),
    description: v.string(),
    title: v.optional(v.string()),
    assignedCharacterId: v.optional(v.id("characters")),
    targetDurationMs: v.optional(v.number()),
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
    cinematicDirection: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("scenes", { ...args, generationStatus: "draft" }),
});

export const update = mutation({
  args: {
    id: v.id("scenes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetDurationMs: v.optional(v.number()),
    mood: v.optional(v.string()),
    stylePreset: v.optional(v.string()),
    cinematicDirection: v.optional(v.string()),
    promptPreview: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => ctx.db.patch(id, fields),
});

export const assignCharacter = mutation({
  args: {
    id: v.id("scenes"),
    characterId: v.optional(v.id("characters")),
  },
  handler: async (ctx, { id, characterId }) =>
    ctx.db.patch(id, { assignedCharacterId: characterId }),
});

export const setGenerationStatus = mutation({
  args: {
    id: v.id("scenes"),
    status: generationStatus,
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, errorMessage }) =>
    ctx.db.patch(id, {
      generationStatus: status,
      ...(errorMessage !== undefined ? { errorMessage } : {}),
    }),
});

export const linkClip = mutation({
  args: {
    id: v.id("scenes"),
    clipVideoUrl: v.string(),
    providerJobId: v.optional(v.string()),
  },
  handler: async (ctx, { id, clipVideoUrl, providerJobId }) =>
    ctx.db.patch(id, {
      clipVideoUrl,
      generationStatus: "ready",
      lastGeneratedAt: Date.now(),
      errorMessage: undefined,
      ...(providerJobId ? { providerJobId } : {}),
    }),
});

export const reorder = mutation({
  args: {
    updates: v.array(v.object({ id: v.id("scenes"), order: v.number() })),
  },
  handler: async (ctx, { updates }) => {
    for (const { id, order } of updates) await ctx.db.patch(id, { order });
  },
});

export const remove = mutation({
  args: { id: v.id("scenes") },
  handler: async (ctx, { id }) => {
    const scene = await ctx.db.get(id);
    if (scene?.clipStorageId) await ctx.storage.delete(scene.clipStorageId);
    await ctx.db.delete(id);
  },
});

// ── Server-side prompt preparation ─────────────────────────────────────────
// Builds the Replicate-ready prompt from scene + character data, persists
// promptPreview for the storyboard UI, and returns routing context for the action.
// Convex backend cannot import from app/lib/ so the prompt logic is inlined here.

export const preparePrompt = mutation({
  args: { id: v.id("scenes") },
  handler: async (ctx, { id }) => {
    const scene = await ctx.db.get(id);
    if (!scene) throw new Error("Scene not found");

    const character = scene.assignedCharacterId
      ? await ctx.db.get(scene.assignedCharacterId)
      : null;

    const parts: string[] = [];
    if (character?.name && character?.description) {
      parts.push(`${character.name}, ${character.description}`);
    } else if (character?.name) {
      parts.push(character.name);
    }
    parts.push(scene.description);
    if (scene.mood) parts.push(`${scene.mood} mood`);
    if (scene.stylePreset) parts.push(scene.stylePreset);
    if (scene.cinematicDirection) parts.push(scene.cinematicDirection);
    parts.push("cinematic, high quality, music video aesthetic, 4K");

    const prompt = parts.filter(Boolean).join(", ");
    await ctx.db.patch(id, { promptPreview: prompt });

    return {
      prompt,
      characterImageUrl: character?.imageUrl ?? null,
      durationMs: scene.targetDurationMs ?? null,
      isImageToVideo: !!(character?.imageUrl),
    };
  },
});

// Resets a scene so it can be re-queued for generation.
export const resetForRegenerate = mutation({
  args: { id: v.id("scenes") },
  handler: async (ctx, { id }) => {
    const scene = await ctx.db.get(id);
    if (!scene) return;
    if (scene.clipStorageId) await ctx.storage.delete(scene.clipStorageId);
    await ctx.db.patch(id, {
      generationStatus: "queued",
      clipVideoUrl: undefined,
      clipStorageId: undefined,
      clipThumbnailUrl: undefined,
      providerJobId: undefined,
      errorMessage: undefined,
      lastGeneratedAt: undefined,
    });
  },
});

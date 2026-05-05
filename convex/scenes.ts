import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const generationStatus = v.union(
  v.literal("draft"),
  v.literal("queued"),
  v.literal("running"),
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
  args: { id: v.id("scenes"), status: generationStatus },
  handler: async (ctx, { id, status }) =>
    ctx.db.patch(id, { generationStatus: status }),
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

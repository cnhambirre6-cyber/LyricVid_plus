import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("characters")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect(),
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    personaNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("characters", { ...args, createdAt: Date.now() }),
});

export const update = mutation({
  args: {
    id: v.id("characters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    personaNotes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { id, ...fields }) => ctx.db.patch(id, fields),
});

export const remove = mutation({
  args: { id: v.id("characters") },
  handler: async (ctx, { id }) => {
    const char = await ctx.db.get(id);
    if (char?.imageStorageId) await ctx.storage.delete(char.imageStorageId);
    await ctx.db.delete(id);
  },
});

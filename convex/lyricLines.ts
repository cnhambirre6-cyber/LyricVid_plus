import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("lyricTimingLines")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect(),
});

export const upsertLine = mutation({
  args: {
    id: v.optional(v.id("lyricTimingLines")),
    projectId: v.id("projects"),
    order: v.number(),
    text: v.string(),
    startMs: v.number(),
    endMs: v.optional(v.number()),
    emphasis: v.optional(v.boolean()),
    displayStyle: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return ctx.db.insert("lyricTimingLines", data);
  },
});

export const deleteLine = mutation({
  args: { id: v.id("lyricTimingLines") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

export const reorderLines = mutation({
  args: {
    updates: v.array(v.object({ id: v.id("lyricTimingLines"), order: v.number() })),
  },
  handler: async (ctx, { updates }) => {
    for (const { id, order } of updates) {
      await ctx.db.patch(id, { order });
    }
  },
});

export const replaceAll = mutation({
  args: {
    projectId: v.id("projects"),
    lines: v.array(
      v.object({
        order: v.number(),
        text: v.string(),
        startMs: v.number(),
        endMs: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { projectId, lines }) => {
    const existing = await ctx.db
      .query("lyricTimingLines")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const line of existing) await ctx.db.delete(line._id);
    for (const line of lines) await ctx.db.insert("lyricTimingLines", { projectId, ...line });
  },
});

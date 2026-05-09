import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Queries ────────────────────────────────────────────────────────────────

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("lyricTimingLines")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect(),
});

// ── Mutations ──────────────────────────────────────────────────────────────

export const upsertLine = mutation({
  args: {
    id: v.optional(v.id("lyricTimingLines")),
    projectId: v.id("projects"),
    order: v.number(),
    text: v.string(),
    startMs: v.number(),
    endMs: v.optional(v.number()),
    emphasisStyle: v.optional(v.string()),
    animationPreset: v.optional(v.string()),
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
    for (const { id, order } of updates) await ctx.db.patch(id, { order });
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

// Parse raw lyrics text (LRC or plain) server-side, then atomically replace all lines.
// Returns the number of lines inserted.
// LRC format: [MM:SS.xx] lyric text  (standard .lrc timestamps)
// Plain text: one lyric per line — no timestamps, startMs defaults to 0 (user syncs manually)
export const parseLyricsIntoTimingLines = mutation({
  args: {
    projectId: v.id("projects"),
    rawLyrics: v.string(),
  },
  handler: async (ctx, { projectId, rawLyrics }) => {
    const parsed = parseLyricsText(rawLyrics);

    const existing = await ctx.db
      .query("lyricTimingLines")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const line of existing) await ctx.db.delete(line._id);
    for (const line of parsed) {
      await ctx.db.insert("lyricTimingLines", { projectId, ...line });
    }

    return parsed.length;
  },
});

// ── Inline parser (mirrors lib/parseLyrics.ts — kept here because the Convex
//    backend compiles independently and cannot import from app/lib/)  ───────

interface ParsedLine {
  order: number;
  text: string;
  startMs: number;
  endMs?: number;
}

const LRC_RE = /^\[(\d{1,2}):(\d{2})\.(\d{1,3})\]\s*/;
const LRC_METADATA_RE = /^\[(ti|ar|al|by|offset):/i;

function parseLyricsText(raw: string): ParsedLine[] {
  const lines = raw.split("\n");
  const hasTimestamps = /\[\d{1,2}:\d{2}\.\d+\]/.test(raw);

  if (!hasTimestamps) {
    return lines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text, i) => ({ order: i, text, startMs: 0 }));
  }

  const result: ParsedLine[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || LRC_METADATA_RE.test(trimmed)) continue;
    const m = LRC_RE.exec(trimmed);
    if (!m) continue;
    const startMs =
      (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000 +
      parseInt(m[3].padEnd(3, "0"), 10);
    const text = trimmed.replace(LRC_RE, "").trim();
    if (text) result.push({ order: result.length, text, startMs });
  }

  // Derive endMs from the next line's startMs
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].endMs === undefined) result[i].endMs = result[i + 1].startMs;
  }

  return result;
}

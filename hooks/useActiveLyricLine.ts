"use client";
import { useMemo } from "react";
import type { LyricLine } from "@/components/lyric/LyricLineRow";

/**
 * Returns the currently active lyric line for a given playback time.
 * A line is active when currentMs >= startMs and either:
 *  - no endMs set and it's the last line before the next one starts
 *  - currentMs < endMs
 */
export function useActiveLyricLine(
  lines: LyricLine[],
  currentMs: number
): LyricLine | null {
  return useMemo(() => {
    if (!lines.length) return null;

    const sorted = [...lines].sort((a, b) => a.startMs - b.startMs);

    for (let i = sorted.length - 1; i >= 0; i--) {
      const line = sorted[i];
      if (currentMs < line.startMs) continue;
      if (line.endMs !== undefined && currentMs >= line.endMs) continue;
      return line;
    }

    return null;
  }, [lines, currentMs]);
}

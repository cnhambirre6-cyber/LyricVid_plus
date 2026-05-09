export interface ParsedLine {
  order: number;
  text: string;
  startMs: number;
  endMs?: number;
}

/**
 * Parse LRC-format lyrics into structured lines.
 * Supports: [MM:SS.xx] or [MM:SS.x] prefixes.
 * Lines without timestamps are assigned startMs = 0 with sequential order.
 */
export function parseLyricsLrc(raw: string): ParsedLine[] {
  const lines = raw.split("\n");
  const result: ParsedLine[] = [];

  const timeRegex = /^\[(\d{1,2}):(\d{2})\.(\d{1,3})\]\s*/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("[ti:") || line.startsWith("[ar:")) continue;

    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centis = parseInt(match[3].padEnd(3, "0"), 10);
      const startMs = (minutes * 60 + seconds) * 1000 + centis;
      const text = line.replace(timeRegex, "").trim();
      if (text) {
        result.push({ order: result.length, text, startMs });
      }
    } else if (line) {
      result.push({ order: result.length, text: line, startMs: 0 });
    }
  }

  // Derive endMs from next line's startMs
  for (let i = 0; i < result.length - 1; i++) {
    if (!result[i].endMs) {
      result[i].endMs = result[i + 1].startMs;
    }
  }

  return result;
}

/**
 * Parse plain text lyrics into lines with no timestamps.
 * Useful for the initial import before timing is added.
 */
export function parsePlainLyrics(raw: string): ParsedLine[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text, i) => ({ order: i, text, startMs: 0 }));
}

/** Auto-detect and parse either LRC or plain text */
export function parseLyrics(raw: string): ParsedLine[] {
  const hasTimestamps = /\[\d{1,2}:\d{2}\.\d+\]/.test(raw);
  return hasTimestamps ? parseLyricsLrc(raw) : parsePlainLyrics(raw);
}

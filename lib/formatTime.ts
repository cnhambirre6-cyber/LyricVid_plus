/** Format milliseconds as MM:SS.s (e.g. 01:23.4) */
export function formatMs(ms: number): string {
  const totalSec = ms / 1000;
  const minutes = Math.floor(totalSec / 60);
  const seconds = (totalSec % 60).toFixed(1);
  return `${String(minutes).padStart(2, "0")}:${seconds.padStart(4, "0")}`;
}

/** Format seconds as M:SS */
export function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Parse "MM:SS.s" or "MM:SS" into milliseconds */
export function parseTimeInput(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length !== 2) return null;
  const minutes = parseFloat(parts[0]);
  const seconds = parseFloat(parts[1]);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  return Math.round((minutes * 60 + seconds) * 1000);
}

/** Current audio time in ms from an HTMLAudioElement */
export function audioTimeMs(el: HTMLAudioElement): number {
  return Math.round(el.currentTime * 1000);
}

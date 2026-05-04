"use client";
import { cn } from "@/lib/utils";

const VISUAL_STYLES = [
  { value: "cinematic",     label: "Cinematic",      desc: "Film grain, deep shadows" },
  { value: "neon-noir",     label: "Neon Noir",       desc: "Urban glow, rain, contrast" },
  { value: "dreamscape",    label: "Dreamscape",      desc: "Soft bloom, pastel haze" },
  { value: "abstract",      label: "Abstract",        desc: "Geometric, color fields" },
  { value: "vintage-film",  label: "Vintage Film",    desc: "Warm tones, light leaks" },
  { value: "minimalist",    label: "Minimalist",      desc: "Clean, high contrast" },
] as const;

const LYRIC_STYLES = [
  { value: "fade-in",           label: "Fade In",           desc: "Smooth opacity entrance" },
  { value: "slide-up",          label: "Slide Up",          desc: "Lines drift upward" },
  { value: "karaoke-highlight", label: "Karaoke",           desc: "Progressive word highlight" },
  { value: "word-glow",         label: "Word Glow",         desc: "Glowing word activation" },
  { value: "cinematic-center",  label: "Cinematic",         desc: "Bold centered display" },
  { value: "beat-pulse",        label: "Beat Pulse",        desc: "Scale on beat" },
  { value: "lower-third",       label: "Lower Third",       desc: "Subtitle-style placement" },
] as const;

type Mode = "visual" | "lyric";

interface StylePresetPickerProps {
  mode: Mode;
  value?: string;
  onChange: (preset: string) => void;
}

export function StylePresetPicker({ mode, value, onChange }: StylePresetPickerProps) {
  const presets = mode === "visual" ? VISUAL_STYLES : LYRIC_STYLES;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {presets.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => onChange(preset.value)}
          className={cn(
            "flex flex-col items-start gap-0.5 rounded-studio p-3 text-left transition-all duration-150",
            value === preset.value
              ? "bg-accent-muted border border-accent/40"
              : "bg-studio-elevated border border-studio-border hover:border-studio-ring"
          )}
        >
          <span className={cn(
            "text-sm font-medium",
            value === preset.value ? "text-ink-accent" : "text-ink-primary"
          )}>
            {preset.label}
          </span>
          <span className="text-xs text-ink-muted">{preset.desc}</span>
        </button>
      ))}
    </div>
  );
}

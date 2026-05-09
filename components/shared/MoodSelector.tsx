"use client";
import { cn } from "@/lib/utils";

const MOODS = [
  { value: "cinematic",   label: "Cinematic",   emoji: "🎬" },
  { value: "dreamy",      label: "Dreamy",       emoji: "✨" },
  { value: "melancholic", label: "Melancholic",  emoji: "🌧️" },
  { value: "energetic",   label: "Energetic",    emoji: "⚡" },
  { value: "romantic",    label: "Romantic",     emoji: "🌹" },
  { value: "dark",        label: "Dark",         emoji: "🌑" },
  { value: "uplifting",   label: "Uplifting",    emoji: "🌅" },
  { value: "mysterious",  label: "Mysterious",   emoji: "🌙" },
] as const;

interface MoodSelectorProps {
  value?: string;
  onChange: (mood: string) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onChange(mood.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm transition-all duration-150",
            value === mood.value
              ? "bg-accent-muted border border-accent/40 text-ink-accent"
              : "bg-studio-elevated border border-studio-border text-ink-secondary hover:border-studio-ring hover:text-ink-primary"
          )}
        >
          <span className="text-base leading-none">{mood.emoji}</span>
          {mood.label}
        </button>
      ))}
    </div>
  );
}

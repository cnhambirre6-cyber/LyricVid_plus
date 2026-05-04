"use client";
import { useEffect, useState } from "react";
import { Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoodSelector } from "@/components/shared/MoodSelector";
import { buildScenePrompt } from "@/lib/buildScenePrompt";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Character {
  _id: Id<"characters">;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface Scene {
  _id: Id<"scenes">;
  title?: string;
  description: string;
  assignedCharacterId?: Id<"characters">;
  targetDurationSec?: number;
  mood?: string;
  style?: string;
  cinematicDirection?: string;
  promptPreview?: string;
}

interface SceneEditorPanelProps {
  scene: Scene;
  characters: Character[];
  onGenerateClip?: (sceneId: Id<"scenes">) => void;
  isGenerating?: boolean;
}

export function SceneEditorPanel({ scene, characters, onGenerateClip, isGenerating }: SceneEditorPanelProps) {
  const updateScene = useMutation(api.scenes.update);

  const [draft, setDraft] = useState({
    title: scene.title ?? "",
    description: scene.description,
    assignedCharacterId: scene.assignedCharacterId as Id<"characters"> | undefined,
    targetDurationSec: scene.targetDurationSec ?? 5,
    mood: scene.mood ?? "",
    style: scene.style ?? "",
    cinematicDirection: scene.cinematicDirection ?? "",
  });

  const assignedChar = characters.find((c) => c._id === draft.assignedCharacterId);

  const generatedPrompt = buildScenePrompt({
    description: draft.description,
    mood: draft.mood,
    style: draft.style,
    cinematicDirection: draft.cinematicDirection,
    characterName: assignedChar?.name,
    characterDescription: assignedChar?.description,
  });

  // Sync if scene changes (e.g. different scene selected)
  useEffect(() => {
    setDraft({
      title: scene.title ?? "",
      description: scene.description,
      assignedCharacterId: scene.assignedCharacterId as Id<"characters"> | undefined,
      targetDurationSec: scene.targetDurationSec ?? 5,
      mood: scene.mood ?? "",
      style: scene.style ?? "",
      cinematicDirection: scene.cinematicDirection ?? "",
    });
  }, [scene._id]);

  const save = () => {
    updateScene({
      id: scene._id,
      ...draft,
      promptPreview: generatedPrompt,
    });
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-primary">Scene Editor</h3>
        <Button variant="ghost" size="sm" onClick={save}>
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-secondary">Title</label>
        <Input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Scene title (optional)"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-secondary">Description</label>
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Describe what happens in this scene…"
          className="min-h-[90px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-secondary">Character (optional)</label>
        <select
          className="input-base h-9 text-sm"
          value={draft.assignedCharacterId ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              assignedCharacterId: (e.target.value as Id<"characters">) || undefined,
            }))
          }
        >
          <option value="">No character</option>
          {characters.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-secondary">Mood</label>
        <MoodSelector
          value={draft.mood}
          onChange={(mood) => setDraft((d) => ({ ...d, mood }))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-secondary">Cinematic direction</label>
        <Input
          value={draft.cinematicDirection}
          onChange={(e) => setDraft((d) => ({ ...d, cinematicDirection: e.target.value }))}
          placeholder="e.g. slow pan, overhead shot, close-up…"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-ink-secondary">Duration (sec)</label>
          <Input
            type="number"
            min={1}
            max={30}
            value={draft.targetDurationSec}
            onChange={(e) => setDraft((d) => ({ ...d, targetDurationSec: Number(e.target.value) }))}
          />
        </div>
      </div>

      {/* Prompt preview */}
      <div className="flex flex-col gap-1 rounded-studio bg-studio-elevated border border-studio-border p-3">
        <p className="text-xs font-medium text-ink-muted mb-1">Generated prompt preview</p>
        <p className="text-xs text-ink-secondary leading-relaxed italic">{generatedPrompt}</p>
      </div>

      {onGenerateClip && (
        <Button
          variant="primary"
          onClick={() => { save(); onGenerateClip(scene._id); }}
          disabled={isGenerating || !draft.description.trim()}
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating…" : "Generate clip"}
        </Button>
      )}
    </div>
  );
}

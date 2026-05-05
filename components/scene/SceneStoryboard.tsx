"use client";
import { Plus, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClipPreviewCard } from "./ClipPreviewCard";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { GenerationStatusValue } from "@/components/shared/GenerationStatusBadge";

interface Scene {
  _id: Id<"scenes">;
  order: number;
  title?: string;
  description: string;
  generationStatus: GenerationStatusValue;
  clipVideoUrl?: string;
}

interface SceneStoryboardProps {
  projectId: Id<"projects">;
  scenes: Scene[];
  selectedSceneId?: Id<"scenes">;
  onSelectScene: (id: Id<"scenes">) => void;
  onRegenerateScene?: (id: Id<"scenes">) => void;
}

export function SceneStoryboard({
  projectId,
  scenes,
  selectedSceneId,
  onSelectScene,
  onRegenerateScene,
}: SceneStoryboardProps) {
  const createScene = useMutation(api.scenes.create);

  const addScene = () => {
    createScene({ projectId, order: scenes.length, description: "" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-primary">Storyboard</span>
          {scenes.length > 0 && (
            <span className="text-xs text-ink-muted">({scenes.length} scenes)</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={addScene}>
          <Plus className="h-3.5 w-3.5" />
          Add scene
        </Button>
      </div>

      {scenes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-studio-border bg-studio-surface py-12 text-center">
          <Film className="h-8 w-8 text-ink-muted opacity-40" />
          <p className="text-sm text-ink-secondary">No scenes yet</p>
          <p className="text-xs text-ink-muted">Add scenes to build your storyboard</p>
          <Button variant="outline" size="sm" onClick={addScene}>
            <Plus className="h-4 w-4" />
            Add first scene
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {scenes.map((scene) => (
            <ClipPreviewCard
              key={scene._id}
              sceneId={scene._id}
              title={scene.title}
              order={scene.order}
              generationStatus={scene.generationStatus}
              clipVideoUrl={scene.clipVideoUrl}
              isSelected={scene._id === selectedSceneId}
              onSelect={() => onSelectScene(scene._id)}
              onRegenerate={onRegenerateScene ? () => onRegenerateScene(scene._id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

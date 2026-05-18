"use client";
import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { AudioUploader } from "@/components/shared/AudioUploader";
import { AudioFileCard } from "@/components/shared/AudioFileCard";
import { CharacterManager } from "@/components/scene/CharacterManager";
import { SceneStoryboard } from "@/components/scene/SceneStoryboard";
import { SceneEditorPanel } from "@/components/scene/SceneEditorPanel";
import { GenerationStatusBadge } from "@/components/shared/GenerationStatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors, Download, Music2, Layers, FileText } from "lucide-react";
import type { SceneRef } from "@/lib/workspaceTypes";

export function SceneProjectWorkspaceClient() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  const workspace = useQuery(api.workspace.getSceneProjectWorkspace, { projectId });

  const createJob = useMutation(api.generationJobs.create);
  const generateClip = useAction(api.generation.generateSceneClip);
  const startStitch = useMutation(api.sceneAssembly.startFinalStitch);
  const assembleVideo = useAction(api.sceneAssembly.assembleFinalVideo);
  const updateSceneContent = useMutation(api.sceneProjects.updateContent);

  const [selectedSceneId, setSelectedSceneId] = useState<Id<"scenes"> | null>(null);
  const [generatingSceneIds, setGeneratingSceneIds] = useState<Set<string>>(new Set());
  const [stitching, setStitching] = useState(false);
  const [rawLyrics, setRawLyrics] = useState("");

  const lyricsInitialized = useRef(false);
  const lyricsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise lyrics field once workspace loads (don't overwrite local edits)
  if (workspace && !lyricsInitialized.current) {
    lyricsInitialized.current = true;
    setRawLyrics(workspace.rawLyrics);
  }

  const handleLyricsChange = useCallback(
    (v: string) => {
      setRawLyrics(v);
      if (lyricsSaveTimer.current) clearTimeout(lyricsSaveTimer.current);
      lyricsSaveTimer.current = setTimeout(() => {
        updateSceneContent({ projectId, rawLyrics: v });
      }, 800);
    },
    [projectId, updateSceneContent]
  );

  const scenes = workspace?.scenes ?? [];
  const characters = workspace?.characters ?? [];
  const selectedScene = scenes.find((s: SceneRef) => s._id === selectedSceneId) ?? null;

  const handleGenerateClip = async (sceneId: Id<"scenes">) => {
    setGeneratingSceneIds((prev) => new Set(prev).add(sceneId));
    try {
      const jobId = await createJob({
        projectId,
        sceneId,
        type: "sceneClip",
        provider: "replicate",
      });
      await generateClip({ jobId, sceneId, projectId });
    } finally {
      setGeneratingSceneIds((prev) => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  };

  const handleGenerateAll = async () => {
    for (const scene of scenes) {
      if (scene.generationStatus !== "ready") {
        await handleGenerateClip(scene._id);
      }
    }
  };

  const handleStitch = async () => {
    setStitching(true);
    try {
      const { jobId } = await startStitch({ projectId });
      await assembleVideo({ jobId, projectId });
    } finally {
      setStitching(false);
    }
  };

  if (workspace === undefined) {
    return (
      <div className="min-h-screen bg-studio-bg">
        <StudioHeader />
        <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-card" />
            <Skeleton className="h-96 rounded-card" />
          </div>
          <Skeleton className="h-full rounded-card" />
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  const { project, audio } = workspace;
  const allScenesReady = scenes.length > 0 && workspace.readySceneCount === scenes.length;

  return (
    <div className="min-h-screen bg-studio-bg">
      <StudioHeader
        title={project.title}
        actions={
          <div className="flex items-center gap-3">
            <GenerationStatusBadge status={project.status} />
            {workspace.hasFinalVideo && (
              <Button variant="secondary" size="sm" asChild>
                <a href={workspace.finalVideoUrl} download target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  Download final
                </a>
              </Button>
            )}
          </div>
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="surface p-4 col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Music2 className="h-4 w-4 text-ink-muted" />
              <span className="text-sm font-medium text-ink-primary">Master audio track</span>
            </div>
            {audio ? (
              <AudioFileCard
                projectId={projectId}
                fileName={audio.fileName}
                durationMs={audio.durationMs}
                fileSize={audio.fileSize}
              />
            ) : (
              <AudioUploader projectId={projectId} />
            )}
          </div>

          <div className="surface p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-ink-muted" />
              <span className="text-sm font-medium text-ink-primary">Overview</span>
            </div>
            <div className="space-y-1 mt-3">
              <p className="text-xs text-ink-secondary">{scenes.length} scenes total</p>
              <p className="text-xs text-ink-secondary">{workspace.readySceneCount} clips ready</p>
              <p className="text-xs text-ink-secondary">{characters.length} characters</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={scenes.length === 0 || generatingSceneIds.size > 0}
                onClick={handleGenerateAll}
              >
                Generate all
              </Button>
            </div>
          </div>
        </div>

        {/* Lyrics panel — used as visual fallback for scenes without a description */}
        <div className="surface p-5 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-ink-muted mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-ink-primary">Song lyrics</span>
              <span className="text-xs text-ink-secondary">
                Scenes with no visual description will use these lyrics to generate visuals automatically.
              </span>
            </div>
          </div>
          <Textarea
            value={rawLyrics}
            onChange={(e) => handleLyricsChange(e.target.value)}
            placeholder={"Paste the song lyrics here…\n\nWhen a scene has no description, the AI will use the lyrics as the visual reference for that scene."}
            className="min-h-[120px] font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <div className="surface p-5">
              <CharacterManager projectId={projectId} characters={characters} />
            </div>
            <div className="surface p-5">
              <SceneStoryboard
                projectId={projectId}
                scenes={scenes}
                selectedSceneId={selectedSceneId ?? undefined}
                onSelectScene={setSelectedSceneId}
                onRegenerateScene={handleGenerateClip}
              />
            </div>
          </div>

          <div className="surface-elevated sticky top-20 self-start h-fit">
            {selectedScene ? (
              <SceneEditorPanel
                scene={selectedScene}
                characters={characters}
                onGenerateClip={handleGenerateClip}
                isGenerating={generatingSceneIds.has(selectedScene._id)}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <Layers className="h-7 w-7 text-ink-muted opacity-40" />
                <p className="text-sm text-ink-secondary">Select a scene to edit</p>
                <p className="text-xs text-ink-muted">Click any scene card in the storyboard</p>
              </div>
            )}
          </div>
        </div>

        {allScenesReady && (
          <div className="surface p-5 flex items-center justify-between animate-in">
            <div>
              <p className="text-sm font-semibold text-ink-primary">All clips are ready</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Stitch {scenes.length} clips with your audio into a final music video.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={!workspace.canStartStitch || stitching}
              title={!workspace.hasAudio ? "Upload an audio track first" : ""}
              onClick={handleStitch}
            >
              <Scissors className="h-4 w-4" />
              {stitching ? "Stitching…" : "Stitch final video"}
            </Button>
          </div>
        )}

        {workspace.hasFinalVideo && (
          <div className="surface p-5">
            <p className="text-sm font-semibold text-ink-primary mb-3">Final video</p>
            <video
              src={workspace.finalVideoUrl}
              controls
              className="w-full rounded-studio aspect-video bg-studio-bg"
            />
          </div>
        )}
      </main>
    </div>
  );
}

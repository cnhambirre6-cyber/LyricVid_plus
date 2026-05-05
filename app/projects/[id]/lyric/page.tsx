"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { AudioUploader } from "@/components/shared/AudioUploader";
import { AudioFileCard } from "@/components/shared/AudioFileCard";
import { LyricsEditor } from "@/components/lyric/LyricsEditor";
import { LyricsTimelineEditor } from "@/components/lyric/LyricsTimelineEditor";
import { LyricPreviewPlayer } from "@/components/lyric/LyricPreviewPlayer";
import { StylePresetPicker } from "@/components/shared/StylePresetPicker";
import { MoodSelector } from "@/components/shared/MoodSelector";
import { GenerationStatusBadge } from "@/components/shared/GenerationStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDebouncedProjectSave } from "@/hooks/useDebouncedProjectSave";
import { parseLyrics, type ParsedLine } from "@/lib/parseLyrics";
import type { LyricLine } from "@/components/lyric/LyricLineRow";
import { Sparkles, Download, Music2 } from "lucide-react";

function toLocalLines(parsed: ParsedLine[]): LyricLine[] {
  return parsed.map((p) => ({ id: crypto.randomUUID(), ...p }));
}

export default function LyricVideoWorkspace() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  const project = useQuery(api.projects.get, { id: projectId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lyricProject = useQuery(api.lyricVideoProjects.get, { projectId }) as any;
  const savedLines = useQuery(api.lyricLines.listByProject, { projectId });

  const upsertLine = useMutation(api.lyricLines.upsertLine);
  const deleteLine = useMutation(api.lyricLines.deleteLine);
  const replaceAll = useMutation(api.lyricLines.replaceAll);
  const updateBasics = useMutation(api.projects.updateBasics);
  const updateLyricContent = useMutation(api.lyricVideoProjects.updateContent);
  const createJob = useMutation(api.generationJobs.create);
  const generateBg = useAction(api.generation.generateBackgroundImage);

  const debouncedSave = useDebouncedProjectSave(projectId);

  // Debounce for lyric-specific content (rawLyrics, backgroundPrompt)
  const lyricTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedLyricSave = useCallback(
    (fields: { rawLyrics?: string; backgroundPrompt?: string; lyricStylePreset?: string }) => {
      if (lyricTimerRef.current) clearTimeout(lyricTimerRef.current);
      lyricTimerRef.current = setTimeout(() => {
        updateLyricContent({ projectId, ...fields });
      }, 800);
    },
    [projectId, updateLyricContent]
  );

  const [title, setTitle] = useState("");
  const [rawLyrics, setRawLyrics] = useState("");
  const [localLines, setLocalLines] = useState<LyricLine[]>([]);
  const [currentMs, setCurrentMs] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
  }, [project?._id]);

  useEffect(() => {
    if (!lyricProject) return;
    setRawLyrics(lyricProject.rawLyrics ?? "");
  }, [lyricProject?.projectId]);

  // Sync saved lines from DB
  useEffect(() => {
    if (!savedLines) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLocalLines(
      (savedLines as any[]).map((l: any) => ({
        id: l._id,
        order: l.order,
        text: l.text,
        startMs: l.startMs,
        endMs: l.endMs,
        emphasisStyle: l.emphasisStyle,
        animationPreset: l.animationPreset,
      }))
    );
  }, [savedLines]);

  const audioStorageUrl = useQuery(
    api.files.getStorageUrl,
    project?.audioStorageId ? { storageId: project.audioStorageId } : "skip"
  );
  useEffect(() => {
    if (audioStorageUrl) setAudioUrl(audioStorageUrl);
  }, [audioStorageUrl]);

  const handleImportLines = useCallback(
    (parsed: ParsedLine[]) => {
      const lines = toLocalLines(parsed);
      setLocalLines(lines);
      replaceAll({
        projectId,
        lines: parsed.map((p, i) => ({ order: i, text: p.text, startMs: p.startMs, endMs: p.endMs })),
      });
    },
    [projectId, replaceAll]
  );

  const handleTitleChange = (v: string) => {
    setTitle(v);
    debouncedSave({ title: v });
  };

  const handleLyricsChange = (v: string) => {
    setRawLyrics(v);
    debouncedLyricSave({ rawLyrics: v });
  };

  const handleGenerate = async () => {
    if (!project) return;
    setGenerating(true);
    try {
      const jobId = await createJob({ projectId, type: "lyricBackground", provider: "replicate" });
      await generateBg({
        jobId,
        projectId,
        prompt:
          lyricProject?.backgroundPrompt ??
          `${project.mood ?? "cinematic"} music video background`,
        mood: project.mood,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-studio-bg">
        <StudioHeader />
        <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-48 rounded-card" />
            <Skeleton className="h-64 rounded-card" />
          </div>
          <Skeleton className="h-96 rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studio-bg">
      <StudioHeader
        title={project.title}
        actions={
          <div className="flex items-center gap-2">
            <GenerationStatusBadge status={lyricProject?.generationStatus ?? project.status} />
            {lyricProject?.generatedVideoUrl && (
              <Button variant="secondary" size="sm" asChild>
                <a href={lyricProject.generatedVideoUrl} download target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  Export
                </a>
              </Button>
            )}
          </div>
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left — editor panel */}
        <div className="flex flex-col gap-5">
          <div className="surface p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-secondary">Project title</label>
              <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} />
            </div>
          </div>

          <div className="surface p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4 text-ink-muted" />
              <span className="text-sm font-medium text-ink-primary">Audio track</span>
            </div>
            {project.audioFileName ? (
              <AudioFileCard
                projectId={projectId}
                fileName={project.audioFileName}
                durationMs={project.audioDurationMs}
              />
            ) : (
              <AudioUploader projectId={projectId} onUploaded={() => {}} />
            )}
          </div>

          <div className="surface p-5">
            <Tabs defaultValue="editor">
              <TabsList className="w-full">
                <TabsTrigger value="editor">Lyrics</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <LyricsEditor
                  value={rawLyrics}
                  onChange={handleLyricsChange}
                  onImportLines={handleImportLines}
                />
              </TabsContent>

              <TabsContent value="timeline">
                <LyricsTimelineEditor
                  lines={localLines}
                  currentMs={currentMs}
                  onChangeLines={setLocalLines}
                  onStampLine={(id, ms) => {
                    setLocalLines((prev) =>
                      prev.map((l) => (l.id === id ? { ...l, startMs: ms } : l))
                    );
                  }}
                />
              </TabsContent>

              <TabsContent value="style">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-secondary">Mood</label>
                    <MoodSelector
                      value={project.mood}
                      onChange={(mood) => updateBasics({ id: projectId, mood })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-secondary">Lyric display style</label>
                    <StylePresetPicker
                      mode="lyric"
                      value={lyricProject?.lyricStylePreset}
                      onChange={(v) => updateLyricContent({ projectId, lyricStylePreset: v })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-secondary">Background prompt</label>
                    <Textarea
                      value={lyricProject?.backgroundPrompt ?? ""}
                      onChange={(e) => debouncedLyricSave({ backgroundPrompt: e.target.value })}
                      placeholder="Describe the visual background… e.g. 'rain-soaked city at midnight, neon reflections'"
                    />
                  </div>
                  <Button variant="primary" onClick={handleGenerate} disabled={generating}>
                    <Sparkles className="h-4 w-4" />
                    {generating ? "Generating background…" : "Generate background"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right — preview player */}
        <div className="flex flex-col gap-4">
          <LyricPreviewPlayer
            audioUrl={audioUrl ?? undefined}
            videoUrl={lyricProject?.generatedVideoUrl}
            lines={localLines}
            lyricStyle={lyricProject?.lyricStylePreset}
            onTimeUpdate={setCurrentMs}
          />
          <p className="text-xs text-ink-muted text-center">
            {audioUrl
              ? "Audio is the master sync source. Video is muted."
              : "Upload an audio track to enable playback and lyric sync."}
          </p>
        </div>
      </main>
    </div>
  );
}

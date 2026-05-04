"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { MoodSelector } from "@/components/shared/MoodSelector";
import { StylePresetPicker } from "@/components/shared/StylePresetPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Music2, Film, ArrowRight, ArrowLeft, Check } from "lucide-react";

type ProjectType = "lyricVideo" | "sceneProject";

const STEPS = ["Type", "Basics", "Style"] as const;
type Step = (typeof STEPS)[number];

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createProject = useMutation(api.projects.create);

  const [step, setStep] = useState<Step>("Type");
  const [type, setType] = useState<ProjectType>(
    (searchParams.get("type") as ProjectType) ?? "lyricVideo"
  );
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [mood, setMood] = useState("");
  const [stylePreset, setStylePreset] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = searchParams.get("type") as ProjectType | null;
    if (t) setType(t);
  }, [searchParams]);

  const stepIndex = STEPS.indexOf(step);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const id = await createProject({ title: title.trim(), type, mood, stylePreset });
      router.push(type === "lyricVideo" ? `/projects/${id}/lyric` : `/projects/${id}/scene`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-studio-bg">
      <StudioHeader title="New project" />

      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i < stepIndex && setStep(s)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  s === step
                    ? "bg-accent text-white shadow-glow-sm"
                    : i < stepIndex
                    ? "bg-status-ready/20 text-status-ready cursor-pointer hover:bg-status-ready/30"
                    : "bg-studio-elevated text-ink-muted cursor-not-allowed"
                )}
              >
                {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              <span className={cn("text-sm", s === step ? "text-ink-primary font-medium" : "text-ink-muted")}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-studio-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Step: Type */}
        {step === "Type" && (
          <div className="space-y-4 animate-in">
            <div>
              <h2 className="text-xl font-semibold text-ink-primary">What are you creating?</h2>
              <p className="mt-1 text-sm text-ink-secondary">Choose a workflow to begin.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  value: "lyricVideo" as ProjectType,
                  icon: Music2,
                  title: "Lyric Video",
                  desc: "Sync your lyrics to the song and generate animated visuals for each line.",
                  badge: "Best for singles",
                },
                {
                  value: "sceneProject" as ProjectType,
                  icon: Film,
                  title: "Scene Project",
                  desc: "Build a full music video shot-by-shot with characters, prompts, and cinematic directions.",
                  badge: "Best for storytelling",
                },
              ].map(({ value, icon: Icon, title, desc, badge }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-card border p-5 text-left transition-all duration-200",
                    type === value
                      ? "border-accent/50 bg-accent-muted shadow-studio"
                      : "border-studio-border bg-studio-surface hover:border-studio-ring"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-studio",
                    type === value ? "bg-accent/20" : "bg-studio-elevated"
                  )}>
                    <Icon className={cn("h-5 w-5", type === value ? "text-ink-accent" : "text-ink-muted")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink-primary">{title}</p>
                      <span className="text-xs text-ink-muted bg-studio-elevated rounded-pill px-2 py-0.5">{badge}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-secondary leading-relaxed">{desc}</p>
                  </div>
                  {type === value && (
                    <div className="ml-auto mt-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setStep("Basics")}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Basics */}
        {step === "Basics" && (
          <div className="space-y-5 animate-in">
            <div>
              <h2 className="text-xl font-semibold text-ink-primary">Project basics</h2>
              <p className="mt-1 text-sm text-ink-secondary">Give your project a name.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-secondary">Project title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === "lyricVideo" ? "e.g. 'Summer Night - Lyric Video'" : "e.g. 'Midnight Drive - Music Video'"}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && title.trim() && setStep("Style")}
              />
            </div>
            {type === "sceneProject" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-secondary">Project summary (optional)</label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Briefly describe the concept or story of your music video…"
                />
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep("Type")}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button variant="primary" onClick={() => setStep("Style")} disabled={!title.trim()}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Style */}
        {step === "Style" && (
          <div className="space-y-5 animate-in">
            <div>
              <h2 className="text-xl font-semibold text-ink-primary">Visual style</h2>
              <p className="mt-1 text-sm text-ink-secondary">Set the mood and look — you can change this later.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-secondary">Mood</label>
              <MoodSelector value={mood} onChange={setMood} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-secondary">Visual style</label>
              <StylePresetPicker mode="visual" value={stylePreset} onChange={setStylePreset} />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep("Basics")}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button variant="primary" onClick={handleCreate} disabled={creating || !title.trim()}>
                {creating ? "Creating…" : "Create project"}
                {!creating && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

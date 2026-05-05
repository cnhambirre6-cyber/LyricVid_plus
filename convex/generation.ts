"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Swap these version strings to change providers without touching anything else
const REPLICATE_MODELS = {
  textToVideo:  "lucataco/cogvideox-5b:d01f8cff4d8c86f1e66b9a3c0e8f4b5c1a2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f",
  imageToVideo: "stability-ai/stable-video-diffusion:3f0457e4d1d8f3f9a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
  textToImage:  "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
} as const;

const NEGATIVE_PROMPT =
  "watermark, text overlay, blurry, low quality, distorted, ugly, duplicate, bad anatomy";

type ReplicatePrediction = { id: string; status: string };
type ReplicateResult = { status: string; output?: string | string[]; error?: string };

async function createPrediction(
  model: string,
  input: Record<string, unknown>
): Promise<ReplicatePrediction> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not configured");
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version: model, input }),
  });
  if (!res.ok) throw new Error(`Replicate create failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<ReplicatePrediction>;
}

async function pollUntilDone(predictionId: string, timeoutMs = 300_000): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN!;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4_000));
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${token}` },
    });
    const data = (await res.json()) as ReplicateResult;
    if (data.status === "succeeded") {
      const out = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!out) throw new Error("Replicate returned no output");
      return out;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error ?? `Replicate job ${data.status}`);
    }
  }
  throw new Error("Replicate polling timed out after 5 minutes");
}

// ── Scene clip generation ──────────────────────────────────────────────────

export const generateSceneClip = action({
  args: {
    jobId: v.id("generationJobs"),
    sceneId: v.id("scenes"),
    projectId: v.id("projects"),
    prompt: v.string(),
    characterImageUrl: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, { jobId, sceneId, projectId, prompt, characterImageUrl, durationMs }) => {
    await ctx.runMutation(api.generationJobs.markSceneGenerationStarted, { jobId, sceneId });

    try {
      const durationSec = durationMs ? Math.max(1, Math.round(durationMs / 1000)) : 5;
      let outputUrl: string;

      if (characterImageUrl) {
        const prediction = await createPrediction(REPLICATE_MODELS.imageToVideo, {
          input_image: characterImageUrl,
          motion_bucket_id: 127,
          fps: 24,
          num_frames: durationSec * 24,
        });
        outputUrl = await pollUntilDone(prediction.id);
      } else {
        const prediction = await createPrediction(REPLICATE_MODELS.textToVideo, {
          prompt,
          num_frames: durationSec * 8,
          guidance_scale: 7,
        });
        outputUrl = await pollUntilDone(prediction.id);
      }

      await ctx.runMutation(api.generationJobs.markSceneGenerationCompleted, {
        jobId,
        sceneId,
        clipVideoUrl: outputUrl,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(api.generationJobs.markSceneGenerationFailed, {
        jobId,
        sceneId,
        errorMessage,
      });
    }
  },
});

// ── Lyric background image generation ─────────────────────────────────────

export const generateBackgroundImage = action({
  args: {
    jobId: v.id("generationJobs"),
    projectId: v.id("projects"),
    prompt: v.string(),
    mood: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, projectId, prompt, mood }) => {
    await ctx.runMutation(api.generationJobs.updateStatus, { id: jobId, status: "running" });
    await ctx.runMutation(api.projects.setStatus, { id: projectId, status: "generating" });

    try {
      const fullPrompt = [
        mood ? `${mood} mood` : "",
        prompt,
        "cinematic, high quality, music video aesthetic, 4K",
      ]
        .filter(Boolean)
        .join(", ");

      const prediction = await createPrediction(REPLICATE_MODELS.textToImage, {
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 1920,
        height: 1080,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      });
      const imageUrl = await pollUntilDone(prediction.id);

      await ctx.runMutation(api.lyricVideoProjects.linkGeneratedVideo, {
        projectId,
        videoUrl: imageUrl,
      });
      await ctx.runMutation(api.generationJobs.updateStatus, {
        id: jobId,
        status: "ready",
        outputSnapshot: { url: imageUrl },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(api.generationJobs.updateStatus, {
        id: jobId,
        status: "failed",
        errorMessage,
      });
      await ctx.runMutation(api.projects.setStatus, { id: projectId, status: "failed" });
    }
  },
});

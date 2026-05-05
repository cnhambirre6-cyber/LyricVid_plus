interface ScenePromptInput {
  description: string;
  mood?: string;
  stylePreset?: string;
  cinematicDirection?: string;
  characterName?: string;
  characterDescription?: string;
}

export function buildScenePrompt(input: ScenePromptInput): string {
  const parts: string[] = [];

  if (input.characterName && input.characterDescription) {
    parts.push(`${input.characterName}, ${input.characterDescription}`);
  } else if (input.characterName) {
    parts.push(input.characterName);
  }

  parts.push(input.description);

  if (input.mood) parts.push(`${input.mood} mood`);
  if (input.stylePreset) parts.push(input.stylePreset);
  if (input.cinematicDirection) parts.push(input.cinematicDirection);

  parts.push("cinematic, high quality, music video aesthetic, 4K");

  return parts.filter(Boolean).join(", ");
}

export const NEGATIVE_PROMPT =
  "watermark, text overlay, blurry, low quality, distorted, ugly, duplicate, bad anatomy";

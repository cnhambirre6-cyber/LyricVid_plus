interface ScenePromptInput {
  description: string;
  mood?: string;
  style?: string;
  cinematicDirection?: string;
  characterName?: string;
  characterDescription?: string;
}

/**
 * Builds a cinematically-styled Replicate-ready prompt from scene inputs.
 * Keeps character context prominent when present.
 */
export function buildScenePrompt(input: ScenePromptInput): string {
  const parts: string[] = [];

  if (input.characterName && input.characterDescription) {
    parts.push(`${input.characterName}, ${input.characterDescription}`);
  } else if (input.characterName) {
    parts.push(input.characterName);
  }

  parts.push(input.description);

  if (input.mood) parts.push(`${input.mood} mood`);
  if (input.style) parts.push(input.style);
  if (input.cinematicDirection) parts.push(input.cinematicDirection);

  parts.push("cinematic, high quality, music video aesthetic, 4K");

  return parts.join(", ");
}

const NEGATIVE_PROMPT =
  "watermark, text overlay, blurry, low quality, distorted, ugly, duplicate, bad anatomy";

export { NEGATIVE_PROMPT };

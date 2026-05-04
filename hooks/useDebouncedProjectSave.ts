"use client";
import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type SaveableFields = {
  title?: string;
  mood?: string;
  stylePreset?: string;
  rawLyrics?: string;
  lyricStylePreset?: string;
  backgroundPrompt?: string;
  summary?: string;
};

/**
 * Debounced auto-save for project basics.
 * Waits DELAY ms of inactivity before committing to Convex.
 */
export function useDebouncedProjectSave(
  projectId: Id<"projects"> | undefined,
  delay = 800
) {
  const updateBasics = useMutation(api.projects.updateBasics);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (fields: SaveableFields) => {
      if (!projectId) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updateBasics({ id: projectId, ...fields });
      }, delay);
    },
    [projectId, updateBasics, delay]
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return save;
}

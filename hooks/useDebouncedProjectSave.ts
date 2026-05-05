"use client";
import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Only fields that live on the shared projects record
type ProjectFields = {
  title?: string;
  mood?: string;
  stylePreset?: string;
};

export function useDebouncedProjectSave(
  projectId: Id<"projects"> | undefined,
  delay = 800
) {
  const updateBasics = useMutation(api.projects.updateBasics);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (fields: ProjectFields) => {
      if (!projectId) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updateBasics({ id: projectId, ...fields });
      }, delay);
    },
    [projectId, updateBasics, delay]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return save;
}

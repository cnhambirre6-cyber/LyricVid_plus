"use client";
import { useRef, useState, useCallback } from "react";
import { Upload, Music, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const ACCEPTED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/aac", "audio/ogg", "audio/flac", "audio/x-flac"];
const ACCEPTED_EXTS = ".mp3,.wav,.aac,.ogg,.flac";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

interface AudioUploaderProps {
  projectId: Id<"projects">;
  onUploaded?: (storageId: Id<"_storage">, fileName: string) => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function AudioUploader({ projectId, onUploaded }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const linkAudio = useMutation(api.projects.linkAudio);

  const upload = useCallback(
    async (file: File) => {
      // Validate on the client before requesting a storage URL
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Unsupported format. Use MP3, WAV, AAC, OGG, or FLAC.");
        setState("error");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File exceeds 50 MB limit.");
        setState("error");
        return;
      }

      setState("uploading");
      setError(null);
      setProgress(0);

      try {
        const uploadUrl = await generateUploadUrl();

        const storageId = await new Promise<Id<"_storage">>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          });
          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText).storageId);
            } else {
              reject(new Error("Upload failed"));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        await linkAudio({
          id: projectId,
          storageId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });

        setState("success");
        onUploaded?.(storageId, file.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setState("error");
      }
    },
    [generateUploadUrl, linkAudio, projectId, onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => state === "idle" && inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer",
        isDragging
          ? "border-accent bg-accent-muted scale-[1.01]"
          : state === "success"
            ? "border-status-ready/40 bg-status-ready/5 cursor-default"
            : state === "error"
              ? "border-status-failed/40 bg-status-failed/5"
              : "border-studio-border bg-studio-surface hover:border-studio-ring hover:bg-studio-elevated"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTS}
        className="hidden"
        onChange={handleChange}
      />

      {state === "idle" && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-elevated border border-studio-border">
            <Music className="h-6 w-6 text-ink-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-primary">
              Drop your track here, or <span className="text-ink-accent">browse</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">MP3, WAV, AAC, OGG, FLAC · Max 50 MB</p>
          </div>
          <Upload className="absolute right-4 top-4 h-4 w-4 text-ink-muted opacity-40" />
        </>
      )}

      {state === "uploading" && (
        <>
          <div className="h-12 w-12 rounded-full border-2 border-studio-border border-t-accent animate-spin" />
          <p className="text-sm text-ink-secondary">Uploading… {progress}%</p>
          <div className="w-full max-w-xs h-1 rounded-full bg-studio-elevated overflow-hidden">
            <div
              className="h-full bg-accent-gradient transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      {state === "success" && (
        <>
          <CheckCircle2 className="h-10 w-10 text-status-ready" />
          <p className="text-sm font-medium text-status-ready">Track uploaded successfully</p>
        </>
      )}

      {state === "error" && (
        <>
          <AlertCircle className="h-10 w-10 text-status-failed" />
          <p className="text-sm text-status-failed">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setState("idle");
              setError(null);
            }}
          >
            Try again
          </Button>
        </>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { User, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

interface CharacterCardProps {
  id: Id<"characters">;
  name: string;
  description?: string;
  imageUrl?: string;
  styleNotes?: string;
}

export function CharacterCard({ id, name, description, imageUrl, styleNotes }: CharacterCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name,
    description: description ?? "",
    styleNotes: styleNotes ?? "",
  });

  const updateChar = useMutation(api.characters.update);
  const removeChar = useMutation(api.characters.remove);

  const save = async () => {
    await updateChar({ id, ...draft });
    setEditing(false);
  };

  const cancel = () => {
    setDraft({ name, description: description ?? "", styleNotes: styleNotes ?? "" });
    setEditing(false);
  };

  return (
    <div className="group relative flex flex-col gap-3 rounded-card bg-card-gradient border border-studio-border p-4 hover:border-studio-ring transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-studio bg-studio-elevated border border-studio-border">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-5 w-5 text-ink-muted" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="h-7 text-sm font-semibold"
              placeholder="Character name"
              autoFocus
            />
          ) : (
            <p className="text-sm font-semibold text-ink-primary truncate">{name}</p>
          )}
        </div>

        <div
          className={`flex gap-1 ${editing ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        >
          {editing ? (
            <>
              <Button variant="ghost" size="icon-sm" onClick={save} className="text-status-ready">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={cancel} className="text-ink-muted">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing(true)}
                className="text-ink-muted hover:text-ink-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeChar({ id })}
                className="text-ink-muted hover:text-status-failed"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Character description…"
            className="min-h-[60px] text-xs"
          />
          <Textarea
            value={draft.styleNotes}
            onChange={(e) => setDraft((d) => ({ ...d, styleNotes: e.target.value }))}
            placeholder="Style or visual notes for AI generation (optional)…"
            className="min-h-[50px] text-xs"
          />
        </div>
      ) : (
        description && (
          <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">{description}</p>
        )
      )}
    </div>
  );
}

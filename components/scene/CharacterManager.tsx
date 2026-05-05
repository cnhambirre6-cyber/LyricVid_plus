"use client";
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterCard } from "./CharacterCard";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Character {
  _id: Id<"characters">;
  name: string;
  description?: string;
  imageUrl?: string;
  styleNotes?: string;
}

interface CharacterManagerProps {
  projectId: Id<"projects">;
  characters: Character[];
}

export function CharacterManager({ projectId, characters }: CharacterManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const createChar = useMutation(api.characters.create);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createChar({ projectId, name: newName.trim() });
    setNewName("");
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-primary">Characters</span>
          {characters.length > 0 && (
            <span className="text-xs text-ink-muted">({characters.length})</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {adding && (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Character name…"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setAdding(false); setNewName(""); }
            }}
          />
          <Button variant="primary" size="sm" onClick={handleAdd} disabled={!newName.trim()}>
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewName(""); }}>
            Cancel
          </Button>
        </div>
      )}

      {characters.length === 0 && !adding ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-studio-border bg-studio-surface py-8 text-center">
          <Users className="h-7 w-7 text-ink-muted opacity-40" />
          <p className="text-sm text-ink-secondary">No characters yet</p>
          <p className="text-xs text-ink-muted">Add characters to assign them to scenes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {characters.map((char) => (
            <CharacterCard
              key={char._id}
              id={char._id}
              name={char.name}
              description={char.description}
              imageUrl={char.imageUrl}
              styleNotes={char.styleNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

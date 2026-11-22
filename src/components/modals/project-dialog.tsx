"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { Project } from "@/types";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (name: string, color: string) => void;
  onEditProject?: (id: string, name: string, color: string) => void;
  editingProject?: Project | null;
}

const COLOR_PRESETS = [
  { label: "Slate", value: "#475569" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Blue", value: "#2563eb" },
  { label: "Teal", value: "#0d9488" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#d97706" },
  { label: "Rose", value: "#e11d48" },
  { label: "Violet", value: "#7c3aed" },
];

function ProjectDialogForm({
  editingProject,
  onCreateProject,
  onEditProject,
  onClose,
}: {
  editingProject?: Project | null;
  onCreateProject: (name: string, color: string) => void;
  onEditProject?: (id: string, name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(editingProject?.name ?? "");
  const [color, setColor] = React.useState(editingProject?.color || COLOR_PRESETS[0].value);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nama project tidak boleh kosong!");
      return;
    }
    if (trimmed.length < 2) {
      setError("Nama project minimal 2 karakter.");
      return;
    }

    if (editingProject && onEditProject) {
      onEditProject(editingProject.id, trimmed, color);
    } else {
      onCreateProject(trimmed, color);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {editingProject ? "Edit Project" : "Buat Project Baru"}
        </DialogTitle>
        <DialogDescription>
          {editingProject
            ? "Perbarui nama dan warna aksen project ini."
            : "Project berfungsi sebagai kategori atau board tugas dengan warna khusus."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Nama Project</Label>
          <Input
            id="project-name"
            placeholder="Contoh: Belajar Next.js, UI Design"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="space-y-2">
          <Label>Pilih Warna Aksen</Label>
          <div className="flex flex-wrap gap-2 pt-1">
            {COLOR_PRESETS.map((preset) => {
              const isSelected = color === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className="size-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-background"
                  style={{
                    backgroundColor: preset.value,
                    // @ts-expect-error Tailwind dynamic ring color
                    "--tw-ring-color": isSelected
                      ? preset.value
                      : "transparent",
                  }}
                  title={preset.label}
                >
                  {isSelected && <Check className="size-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Batal
        </Button>
        <Button type="submit">
          {editingProject ? "Simpan Perubahan" : "Buat Project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
  onEditProject,
  editingProject,
}: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <ProjectDialogForm
            key={editingProject?.id ?? "new-project"}
            editingProject={editingProject}
            onCreateProject={onCreateProject}
            onEditProject={onEditProject}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

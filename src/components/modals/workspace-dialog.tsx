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

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWorkspace: (name: string) => void;
}

export function WorkspaceDialog({
  open,
  onOpenChange,
  onCreateWorkspace,
}: WorkspaceDialogProps) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nama workspace tidak boleh kosong!");
      return;
    }
    if (trimmed.length < 3) {
      setError("Nama workspace minimal 3 karakter.");
      return;
    }

    onCreateWorkspace(trimmed);
    setName("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Buat Workspace Baru</DialogTitle>
            <DialogDescription>
              Workspace mengelompokkan project dan task ke dalam satu ruang kerja.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Nama Workspace</Label>
              <Input
                id="ws-name"
                placeholder="Contoh: My Tasks, Sekolah, Work"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit">Buat Workspace</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

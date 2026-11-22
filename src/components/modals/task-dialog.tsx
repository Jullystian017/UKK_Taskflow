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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ListTodo } from "lucide-react";
import { Todo, Project, Workspace, Priority, Status, Subtask } from "@/types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces?: Workspace[];
  projects: Project[];
  defaultWorkspaceId?: string;
  defaultProjectId?: string;
  showWorkspaceSelect?: boolean;
  defaultStatus?: Status;
  editingTodo?: Todo | null;
  onSaveTodo: (todoData: {
    id?: string;
    title: string;
    description: string;
    project_id: string;
    priority: Priority;
    status: Status;
    due_date?: string | null;
    subtasks: Subtask[];
  }) => void;
}

function TaskDialogForm({
  workspaces,
  projects,
  defaultWorkspaceId,
  defaultProjectId,
  showWorkspaceSelect,
  defaultStatus,
  editingTodo,
  onSaveTodo,
  onClose,
}: {
  workspaces?: Workspace[];
  projects: Project[];
  defaultWorkspaceId?: string;
  defaultProjectId?: string;
  showWorkspaceSelect?: boolean;
  defaultStatus?: Status;
  editingTodo?: Todo | null;
  onSaveTodo: TaskDialogProps["onSaveTodo"];
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(editingTodo?.title ?? "");
  const [description, setDescription] = React.useState(editingTodo?.description ?? "");

  // Determine initial workspace ID
  const initialWorkspaceId = React.useMemo(() => {
    if (editingTodo) {
      const proj = projects.find((p) => p.id === editingTodo.project_id);
      if (proj) return proj.workspace_id;
    }
    return defaultWorkspaceId ?? workspaces?.[0]?.id ?? "";
  }, [editingTodo, defaultWorkspaceId, workspaces, projects]);

  const [workspaceId, setWorkspaceId] = React.useState<string>(initialWorkspaceId);

  // Filter projects by selected workspace, but ALWAYS include the project of editingTodo
  const availableProjects = React.useMemo(() => {
    let list = projects;
    if (workspaces && workspaces.length > 0 && workspaceId) {
      const filtered = projects.filter((p) => p.workspace_id === workspaceId);
      list = filtered.length > 0 ? filtered : projects;
    }
    // Pastikan project dari editingTodo selalu ada di list agar nama project muncul (tidak raw id)
    if (editingTodo?.project_id && !list.some((p) => p.id === editingTodo.project_id)) {
      const currentProj = projects.find((p) => p.id === editingTodo.project_id);
      if (currentProj) {
        list = [currentProj, ...list];
      }
    }
    return list;
  }, [projects, workspaces, workspaceId, editingTodo]);

  const [projectId, setProjectId] = React.useState(
    editingTodo?.project_id ?? defaultProjectId ?? availableProjects[0]?.id ?? ""
  );

  const handleWorkspaceChange = (newWsId: string) => {
    setWorkspaceId(newWsId);
    const wsProjects = projects.filter((p) => p.workspace_id === newWsId);
    if (wsProjects.length > 0) {
      setProjectId(wsProjects[0].id);
    }
  };

  const [priority, setPriority] = React.useState<Priority>(editingTodo?.priority ?? "medium");
  const [status, setStatus] = React.useState<Status>(editingTodo?.status ?? defaultStatus ?? "todo");
  const [dueDate, setDueDate] = React.useState(editingTodo?.due_date ?? "");
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(editingTodo?.subtasks ?? []);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      todo_id: editingTodo?.id ?? "",
      title: trimmed,
      is_done: false,
    };
    setSubtasks((prev) => [...prev, newSub]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, is_done: !s.is_done } : s));
      const completed = next.filter((s) => s.is_done).length;
      if (status === "todo" && completed > 0) {
        setStatus("in_progress");
      } else if (next.length > 0 && completed === next.length) {
        setStatus("done");
      }
      return next;
    });
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    // Validasi Wajib UKK
    if (!trimmedTitle) {
      setError("Title tidak boleh kosong!");
      return;
    }
    if (trimmedTitle.length < 3) {
      setError("Title minimal 3 karakter.");
      return;
    }
    if (!projectId) {
      setError("Pilih project terlebih dahulu!");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (dueDate && dueDate < todayStr) {
      setError("Batas waktu tidak boleh sebelum hari ini. Pilih hari ini atau tanggal setelahnya.");
      return;
    }

    onSaveTodo({
      id: editingTodo?.id,
      title: trimmedTitle,
      description: description.trim(),
      project_id: projectId,
      priority,
      status,
      due_date: dueDate || null,
      subtasks,
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {editingTodo ? "Detail & Edit Task" : "Tambah Task Baru"}
        </DialogTitle>
        <DialogDescription>
          {editingTodo
            ? "Kelola rincian tugas, perbarui status, atau checklist subtask di bawah ini."
            : "Isi detail tugas baru dan tambahkan checklist subtask untuk disimpan di dalam project."}
        </DialogDescription>
      </DialogHeader>

      {/* Title Input */}
      <div className="space-y-1.5">
        <Label htmlFor="task-title">
          Judul Task <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-title"
          placeholder="Contoh: Implementasi Auth Supabase"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="task-desc">Deskripsi (Opsional)</Label>
        <textarea
          id="task-desc"
          rows={2}
          placeholder="Catatan tambahan tentang task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Workspace Selector (Tampil di Quick Create sidebar agar user bisa memilih workspace tujuan) */}
      {(showWorkspaceSelect || (!defaultProjectId && workspaces && workspaces.length > 0)) && (
        <div className="space-y-1.5">
          <Label htmlFor="task-workspace">Simpan ke Workspace</Label>
          <Select value={workspaceId} onValueChange={(val) => val && handleWorkspaceChange(val)}>
            <SelectTrigger id="task-workspace" className="w-full">
              <SelectValue placeholder="Pilih Workspace">
                {(val: string | null) =>
                  workspaces?.find((ws) => ws.id === val)?.name ?? "Pilih Workspace"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {workspaces?.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Prioritas & Status Kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Prioritas</Label>
          <Select
            value={priority}
            onValueChange={(val) => val && setPriority(val as Priority)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Prioritas">
                {(val: string | null) => {
                  if (val === "low") return "Rendah (Low)";
                  if (val === "medium") return "Menengah (Medium)";
                  if (val === "high") return "Tinggi (High)";
                  return "Pilih Prioritas";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Rendah (Low)
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Menengah (Medium)
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-500" />
                  Tinggi (High)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status & Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status Kolom</Label>
          <Select
            value={status}
            onValueChange={(val) => val && setStatus(val as Status)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Status">
                {(val: string | null) => {
                  if (val === "todo") return "To Do";
                  if (val === "in_progress") return "In Progress";
                  if (val === "done") return "Done";
                  return "Pilih Status";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-due">Tenggat Waktu (Due Date)</Label>
          <Input
            id="task-due"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={dueDate}
            onChange={(e) => {
              const val = e.target.value;
              const todayStr = new Date().toISOString().split("T")[0];
              if (val && val < todayStr) {
                setError("Batas waktu tidak boleh sebelum hari ini.");
                setDueDate(todayStr);
              } else {
                setError(null);
                setDueDate(val);
              }
            }}
          />
        </div>
      </div>

      {/* Subtasks Checklist */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <ListTodo className="size-3.5" /> Subtask Checklist
          </Label>
          <span className="text-xs text-muted-foreground">
            {subtasks.filter((s) => s.is_done).length}/{subtasks.length}
          </span>
        </div>

        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted/40 text-sm"
            >
              <div
                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                onClick={() => handleToggleSubtask(sub.id)}
              >
                <Checkbox
                  checked={sub.is_done}
                  onCheckedChange={() => handleToggleSubtask(sub.id)}
                  className="size-3.5 rounded"
                />
                <span
                  className={`text-xs truncate select-none ${
                    sub.is_done ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {sub.title}
                </span>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-5 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteSubtask(sub.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Tambah subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtask();
              }
            }}
            className="h-8 text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddSubtask}
            className="h-8 text-xs gap-1 shrink-0"
          >
            <Plus className="size-3" /> Tambah
          </Button>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Batal
        </Button>
        <Button type="submit">
          {editingTodo ? "Simpan Perubahan" : "Buat Task"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  workspaces,
  projects,
  defaultWorkspaceId,
  defaultProjectId,
  showWorkspaceSelect,
  defaultStatus = "todo",
  editingTodo,
  onSaveTodo,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {open && (
          <TaskDialogForm
            key={editingTodo?.id ?? "new"}
            workspaces={workspaces}
            projects={projects}
            defaultWorkspaceId={defaultWorkspaceId}
            defaultProjectId={defaultProjectId}
            showWorkspaceSelect={showWorkspaceSelect}
            defaultStatus={defaultStatus}
            editingTodo={editingTodo}
            onSaveTodo={onSaveTodo}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

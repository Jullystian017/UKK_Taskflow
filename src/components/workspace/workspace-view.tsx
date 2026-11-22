"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { InsightCard } from "@/components/dashboard/insight-card";
import { TaskDialog } from "@/components/modals/task-dialog";
import { Workspace, Project, Todo, Status, Priority, Subtask } from "@/types";

const KanbanBoard = dynamic(
  () => import("@/components/kanban/kanban-board").then((mod) => mod.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {["To Do", "In Progress", "Done"].map((title) => (
          <div
            key={title}
            className="rounded-xl bg-muted/40 p-3.5 border min-h-[220px] animate-pulse space-y-3"
          >
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="h-20 bg-muted/60 rounded" />
            <div className="h-20 bg-muted/60 rounded" />
          </div>
        ))}
      </div>
    ),
  }
);

interface WorkspaceViewProps {
  workspace: Workspace;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
  projects: Project[];
  todos: Todo[];
  onUpdateTodos: (todos: Todo[]) => void;
  onCreateProject?: (name: string, color: string) => void;
  onOpenAiChat?: () => void;
}

function getGreetingSnapshot(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function subscribeToTime(callback: () => void) {
  const interval = setInterval(callback, 60000);
  return () => clearInterval(interval);
}

export function WorkspaceView({
  workspace,
  workspaces = [],
  projects,
  todos,
  onUpdateTodos,
  onOpenAiChat,
}: WorkspaceViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("created");

  // Task Dialog state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [dialogStatus, setDialogStatus] = React.useState<Status>("todo");

  // Dynamic Greeting based on current hour (useSyncExternalStore for clean SSR & React 19 compliance)
  const greeting = React.useSyncExternalStore(
    subscribeToTime,
    getGreetingSnapshot,
    () => "Selamat datang"
  );

  // Filter tasks based on search query, priority, and sort (abaikan event jadwal kalender)
  const filteredTodos = React.useMemo(() => {
    return todos.filter((todo) => {
      // Hanya tampilkan tugas di kanban workspace, bukan jadwal kalender
      if (todo.is_event) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = todo.title.toLowerCase().includes(query);
        const matchDesc = todo.description?.toLowerCase().includes(query) ?? false;
        if (!matchTitle && !matchDesc) return false;
      }
      // Priority filter
      if (priorityFilter !== "all" && todo.priority !== priorityFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "priority") {
        const priorityWeight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return 0; // Default recent
    });
  }, [todos, searchQuery, priorityFilter, sortBy]);

  // Handlers
  const handleUpdateStatus = (todoId: string, newStatus: Status) => {
    const updated = todos.map((t) =>
      t.id === todoId ? { ...t, status: newStatus } : t
    );
    onUpdateTodos(updated);
  };

  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    const updated = todos.map((t) => {
      if (t.id !== todoId) return t;
      const subtasks = (t.subtasks || []).map((s) =>
        s.id === subtaskId ? { ...s, is_done: !s.is_done } : s
      );

      const completedCount = subtasks.filter((s) => s.is_done).length;
      let newStatus: Status = t.status;

      // Jika task masih "todo" dan ada subtask checklist yang dicentang -> otomatis pindah ke "in_progress"
      if (t.status === "todo" && completedCount > 0) {
        newStatus = "in_progress";
      } else if (subtasks.length > 0 && completedCount === subtasks.length) {
        // Jika seluruh checklist subtask telah selesai dicentang -> otomatis pindah ke "done"
        newStatus = "done";
      } else if (t.status === "done" && completedCount < subtasks.length) {
        // Jika dari done ada checklist subtask yang dibuka kembali -> kembali ke "in_progress"
        newStatus = "in_progress";
      }

      return { ...t, subtasks, status: newStatus };
    });
    onUpdateTodos(updated);
  };

  const handleOpenAddTask = (status: Status = "todo") => {
    setEditingTodo(null);
    setDialogStatus(status);
    setIsTaskDialogOpen(true);
  };

  const handleOpenEditTask = (todo: Todo) => {
    setEditingTodo(todo);
    setDialogStatus(todo.status);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (todoId: string) => {
    const deletedTask = todos.find((t) => t.id === todoId);
    if (!deletedTask) return;

    // Hapus task
    const updated = todos.filter((t) => t.id !== todoId);
    onUpdateTodos(updated);

    // Toast dengan fitur Undo 5 detik (Bonus Gampang #1)
    toast.success(`Task "${deletedTask.title}" dihapus`, {
      description: "Anda memiliki 5 detik untuk mengembalikan task.",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          onUpdateTodos([...updated, deletedTask]);
          toast.info("Task berhasil dikembalikan!");
        },
      },
    });
  };

  const handleSaveTodo = (todoData: {
    id?: string;
    title: string;
    description: string;
    project_id: string;
    priority: Priority;
    status: Status;
    due_date?: string | null;
    subtasks: Subtask[];
  }) => {
    if (todoData.id) {
      // Edit
      const updated = todos.map((t) =>
        t.id === todoData.id
          ? {
            ...t,
            title: todoData.title,
            description: todoData.description,
            project_id: todoData.project_id,
            priority: todoData.priority,
            status: todoData.status,
            due_date: todoData.due_date,
            subtasks: todoData.subtasks,
          }
          : t
      );
      onUpdateTodos(updated);
      toast.success("Task berhasil diperbarui!");
    } else {
      // Create new
      const newTodo: Todo = {
        id: `todo-${Date.now()}`,
        title: todoData.title,
        description: todoData.description,
        project_id: todoData.project_id,
        priority: todoData.priority,
        status: todoData.status,
        due_date: todoData.due_date,
        subtasks: todoData.subtasks,
        created_at: new Date().toISOString(),
      };
      onUpdateTodos([newTodo, ...todos]);
      toast.success("Task berhasil ditambahkan!");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Greeting & AI Insight */}
      <div className="px-4 lg:px-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, Siswa!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola tugas dan rencanakan produktivitasmu di workspace{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{workspace.name}&rdquo;
            </span>
          </p>
        </div>

        {/* AI Insight Card */}
        <InsightCard
          todos={filteredTodos}
          workspaceName={workspace.name}
          onOpenAiChat={onOpenAiChat}
        />

        {/* 4 Rich Stats Cards + Progress Bar (matching SectionCards) */}
        <StatsCards todos={filteredTodos} />
      </div>

      {/* 2. Search, Filter & Sort Bar */}
      <div className="px-4 lg:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari judul atau catatan task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={priorityFilter} onValueChange={(val) => val && setPriorityFilter(val)}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="Prioritas">
                {(val: string | null) => {
                  if (val === "all") return "Semua Prioritas";
                  if (val === "high") return "High";
                  if (val === "medium") return "Medium";
                  if (val === "low") return "Low";
                  return "Prioritas";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => val && setSortBy(val)}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="Urutkan">
                {(val: string | null) => {
                  if (val === "created") return "Terbaru";
                  if (val === "priority") return "Prioritas";
                  if (val === "due_date") return "Tenggat Waktu";
                  return "Urutkan";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Terbaru</SelectItem>
              <SelectItem value="priority">Prioritas</SelectItem>
              <SelectItem value="due_date">Tenggat Waktu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => handleOpenAddTask("todo")}
          className="gap-1.5 h-9 font-medium shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Tambah Task Baru</span>
        </Button>
      </div>

      {/* 3. Kanban Board dengan Drag & Drop */}
      <div className="px-4 lg:px-6">
        <KanbanBoard
          todos={filteredTodos}
          projects={projects}
          onUpdateStatus={handleUpdateStatus}
          onAddTask={handleOpenAddTask}
          onEditTask={handleOpenEditTask}
          onDeleteTask={handleDeleteTask}
          onToggleSubtask={handleToggleSubtask}
        />
      </div>

      {/* Modal Dialog Tambah / Edit Task */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        workspaces={workspaces}
        projects={projects}
        defaultProjectId={projects.find((p) => p.workspace_id === workspace.id)?.id ?? projects[0]?.id}
        defaultStatus={dialogStatus}
        editingTodo={editingTodo}
        onSaveTodo={handleSaveTodo}
      />
    </div>
  );
}

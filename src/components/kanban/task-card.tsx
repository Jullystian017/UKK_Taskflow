"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  ListTodo,
  AlertCircle,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Todo, Project } from "@/types";

interface TaskCardProps {
  todo: Todo;
  project?: Project;
  isOverlay?: boolean;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
}

function getTodayMidnightSnapshot(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function subscribeToMidnight(callback: () => void): () => void {
  const interval = setInterval(callback, 60000);
  return () => clearInterval(interval);
}

export function TaskCard({
  todo,
  isOverlay = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleSubtask,
}: TaskCardProps) {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    disabled: isOverlay,
    data: {
      type: "Task",
      todo,
    },
  });

  const isDone = todo.status === "done";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const priorityStyles = {
    high: "bg-destructive/10 text-destructive border-destructive/20 font-medium",
    medium: "bg-muted text-foreground/80 border-border/60 font-medium",
    low: "bg-muted/40 text-muted-foreground border-transparent font-normal",
  };

  const subtasks = todo.subtasks ?? [];
  const completedSubtasks = subtasks.filter((s) => s.is_done).length;
  const subtaskProgress =
    subtasks.length > 0
      ? Math.round((completedSubtasks / subtasks.length) * 100)
      : 0;

  // Format due date & check overdue / due soon (pure derived with useSyncExternalStore for clean SSR)
  const todayTime = React.useSyncExternalStore(
    subscribeToMidnight,
    getTodayMidnightSnapshot,
    () => 0
  );

  let isOverdue = false;
  let isDueSoon = false;
  let formattedDate = "";

  if (todo.due_date && todayTime > 0) {
    const due = new Date(todo.due_date);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - todayTime) / (1000 * 60 * 60 * 24));
    isOverdue = !isDone && diffDays < 0;
    isDueSoon = !isDone && diffDays >= 0 && diffDays <= 2;

    if (diffDays === 0) {
      formattedDate = "Hari ini";
    } else if (diffDays === 1) {
      formattedDate = "Besok";
    } else if (diffDays < 0) {
      formattedDate = `${Math.abs(diffDays)}h terlambat`;
    } else {
      formattedDate = due.toLocaleDateString("id-ID", {
        month: "short",
        day: "numeric",
      });
    }
  }

  return (
    <Card
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={() => {
        if (!isDragging) {
          onEdit(todo);
        }
      }}
      className={`group cursor-pointer rounded-xl border border-border/70 shadow-xs transition-all hover:shadow-md hover:border-foreground/30 bg-card select-none relative ${
        isDone ? "opacity-75 bg-muted/25 border-dashed" : ""
      } ${
        isDragging
          ? "ring-2 ring-primary ring-offset-2 shadow-xl z-50 scale-102 cursor-grabbing"
          : ""
      }`}
    >
      <CardContent className="p-3.5 space-y-3">
        {/* Top Meta Bar: Drag Handle (Titik 6) + Badges (Priority & Due) + Action Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Titik 6 Drag Handle */}
            <div
              className="flex items-center justify-center -ml-1 text-muted-foreground/35 group-hover:text-muted-foreground/80 cursor-grab active:cursor-grabbing transition-colors rounded p-0.5"
              title="Geser posisi task (Drag)"
            >
              <GripVertical className="size-3.5" />
            </div>

            {/* Priority Badge */}
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 capitalize border ${
                priorityStyles[todo.priority]
              }`}
            >
              {todo.priority}
            </Badge>

            {/* Due Date Badge */}
            {formattedDate && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                  isOverdue
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : isDueSoon
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "text-muted-foreground bg-muted/50 border border-border/40"
                }`}
              >
                {isOverdue ? (
                  <AlertCircle className="size-3 text-destructive" />
                ) : (
                  <Calendar className="size-3" />
                )}
                <span>{formattedDate}</span>
              </span>
            )}
          </div>

          {/* Action Menu (More options) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 -mr-1.5 text-muted-foreground/50 hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                  />
                }
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                <DropdownMenuItem
                  onClick={() => onEdit(todo)}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <Pencil className="size-3.5" />
                  <span>Detail & Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(todo.id)}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Task Title & Status Checkbox */}
        <div className="space-y-1">
          <div className="flex items-start gap-2.5">
            <div
              className="pt-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isDone}
                onCheckedChange={() => onToggleStatus(todo.id, todo.status)}
                className="size-4 rounded cursor-pointer"
                aria-label={`Ubah status (saat ini: ${todo.status.replace("_", " ")})`}
                title={
                  todo.status === "todo"
                    ? "Klik untuk mulai pengerjaan (pindah ke In Progress)"
                    : todo.status === "in_progress"
                    ? "Klik untuk tandai selesai (pindah ke Done)"
                    : "Klik untuk kembalikan ke To Do"
                }
              />
            </div>
            <h4
              className={`text-sm font-semibold leading-snug break-words transition-colors ${
                isDone
                  ? "line-through text-muted-foreground"
                  : "text-foreground group-hover:text-primary"
              }`}
            >
              {todo.title}
            </h4>
          </div>

          {/* Description pixel-perfect aligned with Title text (pl-[26px] = size-4 16px + gap-2.5 10px) */}
          {todo.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-[26px]">
              {todo.description}
            </p>
          )}
        </div>

        {/* Subtasks Progress & Interactive Checklist Box */}
        {subtasks.length > 0 && (
          <div
            className="rounded-lg bg-muted/40 border border-border/50 p-2.5 space-y-2 transition-colors hover:bg-muted/60"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              onClick={() => setIsSubtasksExpanded((prev) => !prev)}
              className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors group/sub select-none"
              title="Klik untuk melihat / checklist subtask langsung"
            >
              <span className="flex items-center gap-1.5 font-medium text-[11px]">
                <ListTodo className="size-3.5 text-foreground/70" />
                <span>Subtask</span>
                <ChevronDown
                  className={`size-3 text-muted-foreground transition-transform duration-200 ${
                    isSubtasksExpanded ? "rotate-180" : ""
                  }`}
                />
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-foreground/80">
                {completedSubtasks}/{subtasks.length}{" "}
                <span className="text-muted-foreground font-normal">
                  ({subtaskProgress}%)
                </span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-muted-foreground/15 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  subtaskProgress === 100 ? "bg-emerald-500" : "bg-foreground"
                }`}
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>

            {/* Expanded Subtasks List */}
            {isSubtasksExpanded && (
              <div className="space-y-1 pt-1.5 border-t border-border/50 animate-in fade-in-50 duration-200">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onToggleSubtask?.(todo.id, sub.id)}
                    className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-background/80 cursor-pointer text-xs transition-colors"
                  >
                    <Checkbox
                      checked={sub.is_done}
                      onCheckedChange={() => onToggleSubtask?.(todo.id, sub.id)}
                      className="size-3.5 rounded shrink-0 cursor-pointer"
                    />
                    <span
                      className={`flex-1 text-[11px] leading-tight select-none truncate ${
                        sub.is_done
                          ? "line-through text-muted-foreground"
                          : "text-foreground font-normal"
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

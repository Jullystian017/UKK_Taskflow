"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ListTodo,
  ExternalLink,
} from "lucide-react";
import { Todo, Project, Status, Workspace } from "@/types";

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  todos: Todo[];
  projects: Project[];
  workspaces?: Workspace[];
  onToggleStatus: (todoId: string, currentStatus: Status) => void;
  onEditTask: (todo: Todo) => void;
  onDeleteTask: (todoId: string) => void;
  onAddNewTask: (dateStr: string) => void;
  onNavigateToWorkspace?: (workspaceId: string, todoId?: string) => void;
}

export function DayDetailDialog({
  open,
  onOpenChange,
  selectedDate,
  todos,
  projects,
  workspaces = [],
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onAddNewTask,
  onNavigateToWorkspace,
}: DayDetailDialogProps) {
  if (!selectedDate) return null;

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isPastDate = dateStr < todayStr;
  const formattedDayTitle = format(selectedDate, "EEEE, dd MMMM yyyy", {
    locale: idLocale,
  });

  const dayTodos = todos.filter((t) => {
    if (!t.due_date) return false;
    return t.due_date === dateStr || t.due_date.startsWith(dateStr);
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const workspaceMap = new Map(workspaces.map((w) => [w.id, w]));

  const priorityColors = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-muted text-muted-foreground border-border/60",
    low: "bg-muted/40 text-muted-foreground/80 border-transparent",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Calendar className="size-4" />
            <span>Detail Agenda Tanggal</span>
          </div>
          <DialogTitle className="text-xl capitalize">
            {formattedDayTitle}
          </DialogTitle>
          <DialogDescription>
            {dayTodos.length > 0
              ? `Terdapat ${dayTodos.length} tugas yang jatuh tempo pada hari ini.`
              : "Tidak ada tugas yang dijadwalkan pada hari ini."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          {dayTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed text-center text-muted-foreground bg-muted/20">
              <Clock className="size-10 stroke-[1.5] mb-2 opacity-40 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Jadwal Kosong
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Belum ada tugas dengan tenggat waktu di tanggal ini.
              </p>
              {isPastDate ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-medium">
                  Tanggal ini telah terlewat. Tugas hanya dapat dijadwalkan untuk hari ini atau tanggal setelahnya.
                </p>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onAddNewTask(dateStr);
                  }}
                  className="mt-4 gap-1.5 h-8 text-xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Jadwalkan Task di Tanggal Ini</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayTodos.map((todo) => {
                const project = projectMap.get(todo.project_id);
                const isDone = todo.status === "done";
                const subtasks = todo.subtasks ?? [];
                const completedSubs = subtasks.filter((s) => s.is_done).length;

                return (
                  <div
                    key={todo.id}
                    className={`p-3.5 rounded-xl border transition-all ${isDone
                      ? "bg-muted/40 border-border/60 opacity-80"
                      : "bg-card border-border hover:shadow-xs"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="pt-0.5">
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={() =>
                              onToggleStatus(todo.id, todo.status)
                            }
                            className="size-4 rounded cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm font-semibold truncate ${isDone
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                              }`}
                          >
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {todo.description}
                            </p>
                          )}

                          {/* Subtasks summary */}
                          {subtasks.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5">
                              <ListTodo className="size-3" />
                              <span>
                                {completedSubs}/{subtasks.length} checklist selesai
                              </span>
                            </div>
                          )}

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {todo.is_event && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Jadwal Kalender
                              </span>
                            )}
                            {(() => {
                              const ws = project ? workspaceMap.get(project.workspace_id) : undefined;
                              return ws ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  {ws.name}
                                </span>
                              ) : null;
                            })()}
                            {project && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-foreground">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 capitalize ${priorityColors[todo.priority]
                                }`}
                            >
                              {todo.priority}
                            </Badge>
                            <Badge
                              variant={isDone ? "secondary" : "outline"}
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {todo.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {onNavigateToWorkspace && project && !todo.is_event && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              onOpenChange(false);
                              onNavigateToWorkspace(project.workspace_id, todo.id);
                            }}
                            title="Buka di Workspace Kanban Board"
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            onOpenChange(false);
                            onEditTask(todo);
                          }}
                          title="Edit Task"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteTask(todo.id)}
                          title="Hapus Task"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isPastDate ? (
                <p className="text-xs text-center text-muted-foreground pt-1.5">
                  Tanggal ini telah terlewat. Tugas baru hanya dapat dibuat untuk hari ini atau selanjutnya.
                </p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onAddNewTask(dateStr);
                  }}
                  className="w-full gap-1.5 h-8 text-xs mt-2 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Task Lain di Tanggal Ini</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


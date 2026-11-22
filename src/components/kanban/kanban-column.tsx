"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Inbox } from "lucide-react";
import { TaskCard } from "./task-card";
import { Todo, Project, Status } from "@/types";

interface KanbanColumnProps {
  id: Status;
  title: string;
  todos: Todo[];
  projects: Project[];
  onAddTask: (status: Status) => void;
  onEditTask: (todo: Todo) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
}

export function KanbanColumn({
  id,
  title,
  todos,
  projects,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
  onToggleSubtask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "Column",
      status: id,
    },
  });

  const columnThemes: Record<Status, { dot: string }> = {
    todo: {
      dot: "bg-muted-foreground/40",
    },
    in_progress: {
      dot: "bg-primary/70",
    },
    done: {
      dot: "bg-foreground",
    },
  };

  const projectMap = React.useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  const taskIds = React.useMemo(() => {
    return todos.map((t) => t.id);
  }, [todos]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] max-w-full rounded-xl bg-muted/40 p-3.5 border transition-colors ${
        isOver ? "bg-muted/70 ring-2 ring-primary/40" : ""
      }`}
    >
      {/* Header Kolom */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${columnThemes[id].dot}`}
          />
          <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0 h-5 font-semibold"
          >
            {todos.length}
          </Badge>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-md text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(id)}
          title={`Tambah task ke ${title}`}
        >
          <Plus className="size-4" />
          <span className="sr-only">Tambah task</span>
        </Button>
      </div>

      {/* List Card Droppable */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 flex-1 min-h-[160px]">
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <Inbox className="size-8 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs font-medium">Belum ada task di sini</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => onAddTask(id)}
                className="text-xs h-7 mt-1 text-primary"
              >
                + Tambah Task
              </Button>
            </div>
          ) : (
            todos.map((todo) => (
              <TaskCard
                key={todo.id}
                todo={todo}
                project={projectMap.get(todo.project_id)}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleStatus={onToggleStatus}
                onToggleSubtask={onToggleSubtask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

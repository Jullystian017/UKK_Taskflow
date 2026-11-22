"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import confetti from "canvas-confetti";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { Todo, Project, Status } from "@/types";

interface KanbanBoardProps {
  todos: Todo[];
  projects: Project[];
  onUpdateStatus: (todoId: string, newStatus: Status) => void;
  onAddTask: (status?: Status) => void;
  onEditTask: (todo: Todo) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
}

const COLUMNS: { id: Status; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export function KanbanBoard({
  todos,
  projects,
  onUpdateStatus,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleSubtask,
}: KanbanBoardProps) {
  const [activeTodo, setActiveTodo] = React.useState<Todo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTodo(event.active.data.current.todo);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTodo(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Cek apakah di-drop di atas kolom langsung
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    let targetStatus: Status | null = null;

    if (isOverColumn) {
      targetStatus = overId as Status;
    } else {
      // Di-drop di atas task lain
      const overTodo = todos.find((t) => t.id === overId);
      if (overTodo) {
        targetStatus = overTodo.status;
      }
    }

    if (targetStatus && targetStatus !== activeTodo?.status) {
      onUpdateStatus(activeId, targetStatus);

      // Cek apakah semua task selesai setelah update ini -> tembakkan confetti 🎉
      if (targetStatus === "done") {
        const remainingNotDone = todos.filter(
          (t) => t.id !== activeId && t.status !== "done"
        );
        if (remainingNotDone.length === 0 && todos.length > 0) {
          triggerConfetti();
        }
      }
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    // Alur progres: todo -> in_progress -> done -> todo
    let newStatus: Status = "todo";
    if (currentStatus === "todo") {
      newStatus = "in_progress";
    } else if (currentStatus === "in_progress") {
      newStatus = "done";
    } else {
      newStatus = "todo";
    }
    onUpdateStatus(id, newStatus);

    if (newStatus === "done") {
      const remainingNotDone = todos.filter(
        (t) => t.id !== id && t.status !== "done"
      );
      if (remainingNotDone.length === 0 && todos.length > 0) {
        triggerConfetti();
      }
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore in environments without canvas
    }
  };

  const projectMap = React.useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  return (
    <DndContext
      id="taskflow-kanban-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full items-start">
        {COLUMNS.map((col) => {
          const columnTodos = todos.filter((t) => t.status === col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              todos={columnTodos}
              projects={projects}
              onAddTask={() => onAddTask(col.id)}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onToggleStatus={handleToggleStatus}
              onToggleSubtask={onToggleSubtask}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTodo ? (
          <div className="w-[300px] pointer-events-none">
            <TaskCard
              todo={activeTodo}
              project={projectMap.get(activeTodo.project_id)}
              isOverlay={true}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleStatus={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

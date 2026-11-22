"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";

export function SectionCards() {
  const { todos, workspaces, activeWorkspace } = useDashboard();

  const taskTodos = todos.filter((t) => !t.is_event);
  const totalTodos = taskTodos.length;
  const doneTodos = taskTodos.filter((t) => t.status === "done");
  const inProgressTodos = taskTodos.filter((t) => t.status === "in_progress");
  const todoTodos = taskTodos.filter((t) => t.status === "todo");
  const highPriorityPending = taskTodos.filter(
    (t) => t.priority === "high" && t.status !== "done"
  );

  const completionRate =
    totalTodos > 0 ? Math.round((doneTodos.length / totalTodos) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      {/* 1. Total Tugas */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Tugas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalTodos}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {activeWorkspace?.name || "Workspace"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tersebar di {workspaces.length} workspace aktif{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {totalTodos} total tugas terdaftar
          </div>
        </CardFooter>
      </Card>

      {/* 2. Tugas Selesai */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tugas Selesai</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {doneTodos.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {completionRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tingkat penyelesaian tugas{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {doneTodos.length} dari {totalTodos} tugas tuntas
          </div>
        </CardFooter>
      </Card>

      {/* 3. Sedang Dikerjakan */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Sedang Dikerjakan</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {inProgressTodos.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              In Progress
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Fokus pengerjaan saat ini{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {todoTodos.length} tugas dalam antrean To Do
          </div>
        </CardFooter>
      </Card>

      {/* 4. Prioritas Tinggi */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Prioritas Tinggi</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {highPriorityPending.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {highPriorityPending.length > 0 ? (
                <TrendingDownIcon />
              ) : (
                <TrendingUpIcon />
              )}
              {highPriorityPending.length > 0 ? "Perhatian" : "Terkendali"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {highPriorityPending.length > 0
              ? "Tugas mendesak belum selesai"
              : "Semua prioritas aman"}{" "}
            {highPriorityPending.length > 0 ? (
              <TrendingDownIcon className="size-4" />
            ) : (
              <TrendingUpIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Berdasarkan urgensi prioritas tugas
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

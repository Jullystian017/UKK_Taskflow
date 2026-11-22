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
import {
  Clock,
  Sparkles,
  TrendingUpIcon,
} from "lucide-react";
import { Todo } from "@/types";

interface StatsCardsProps {
  todos: Todo[];
}

export function StatsCards({ todos }: StatsCardsProps) {
  const total = todos.length;
  const done = todos.filter((t) => t.status === "done").length;
  const inProgress = todos.filter((t) => t.status === "in_progress").length;
  const todo = todos.filter((t) => t.status === "todo").length;

  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 4 Rich Summary Cards matching SectionCards aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        {/* Card 1: Total Tasks */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Tugas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {total}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                Semua
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Semua tugas workspace <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Rasio progres {progressPercent}% selesai
            </div>
          </CardFooter>
        </Card>

        {/* Card 2: To Do */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>To Do</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {todo}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Clock className="size-3" />
                Antrean
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Menunggu dikerjakan <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Tersedia di kanban board
            </div>
          </CardFooter>
        </Card>

        {/* Card 3: In Progress */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Sedang Dikerjakan</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {inProgress}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Sparkles className="size-3" />
                In Progress
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Fokus pengerjaan saat ini <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Sedang berlangsung
            </div>
          </CardFooter>
        </Card>

        {/* Card 4: Done */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Tugas Selesai</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {done}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                {progressPercent}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Telah diselesaikan <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {done} dari {total} tugas tuntas
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Progress Bar Penyelesaian Task */}
      {total > 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-2">
              <span>Tingkat Penyelesaian</span>
              <span className="text-muted-foreground font-normal">
                ({done} dari {total} tugas selesai)
              </span>
            </span>
            <span className="font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

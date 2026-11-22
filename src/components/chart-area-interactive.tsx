"use client";

import * as React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useDashboard } from "@/context/dashboard-context";

const chartConfig = {
  tasks: {
    label: "Aktivitas Tugas",
  },
  created: {
    label: "Tugas Dibuat",
    color: "var(--foreground)",
  },
  completed: {
    label: "Tugas Selesai",
    color: "var(--muted-foreground)",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--foreground)",
  },
  todo: {
    label: "To Do",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const { todos, projects, workspaces } = useDashboard();
  const isMobile = useIsMobile();
  const [selectedRange, setSelectedRange] = React.useState<string | null>(null);
  const timeRange = selectedRange ?? (isMobile ? "7d" : "30d");
  const setTimeRange = setSelectedRange;

  const isProjectMode = timeRange === "project";

  // Data Timeline Harian Riil (Tugas Dibuat & Selesai berdasarkan data nyata)
  const timelineData = React.useMemo(() => {
    if (isProjectMode) return [];

    const numDays = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
    const now = new Date();
    const points = [];

    // Iterasi dari rentang hari lalu hingga hari ini secara kronologis
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Hitung REAL tugas yang dibuat pada tanggal ini
      const matchingCreated = todos.filter((t) => {
        if (!t.created_at) return false;
        return t.created_at.startsWith(dateStr);
      }).length;

      // Hitung REAL tugas yang berstatus done pada tanggal ini
      const matchingCompleted = todos.filter((t) => {
        if (t.status !== "done") return false;
        if (t.due_date && t.due_date.startsWith(dateStr)) return true;
        if (t.created_at && t.created_at.startsWith(dateStr)) return true;
        return false;
      }).length;

      points.push({
        date: dateStr,
        created: matchingCreated,
        completed: matchingCompleted,
      });
    }

    return points;
  }, [todos, timeRange, isProjectMode]);

  // Data Distribusi Beban per Workspace Riil
  const projectChartData = React.useMemo(() => {
    if (!isProjectMode) return [];

    return workspaces.map((ws) => {
      const wsTodos = todos.filter((t) => {
        const proj = projects.find((p) => p.id === t.project_id);
        return proj?.workspace_id === ws.id;
      });
      return {
        name: ws.name,
        completed: wsTodos.filter((t) => t.status === "done").length,
        in_progress: wsTodos.filter((t) => t.status === "in_progress").length,
        todo: wsTodos.filter((t) => t.status === "todo").length,
        total: wsTodos.length,
      };
    });
  }, [todos, projects, workspaces, isProjectMode]);

  return (
    <Card className="@container/card border shadow-2xs">
      <CardHeader>
        <CardTitle>
          {isProjectMode ? "Distribusi Beban per Workspace" : "Jadwal & Aktivitas Tugas Riil"}
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {isProjectMode
              ? "Perbandingan jumlah tugas To Do, In Progress, dan Selesai pada tiap workspace"
              : "Menampilkan jumlah tugas dibuat dan tugas selesai secara harian"}
          </span>
          <span className="@[540px]/card:hidden">
            {isProjectMode ? "Beban tugas per workspace" : "Aktivitas tugas"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              if (value && value[0]) {
                setTimeRange(value[0]);
              }
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-3.5! @[767px]/card:flex text-xs"
          >
            <ToggleGroupItem value="7d">7 Hari</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 Hari</ToggleGroupItem>
            <ToggleGroupItem value="90d">3 Bulan</ToggleGroupItem>
            <ToggleGroupItem value="project">Per Workspace</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value);
              }
            }}
          >
            <SelectTrigger
              className="flex w-36 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden text-xs"
              size="sm"
              aria-label="Pilih Periode"
            >
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                7 Hari
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 Hari
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                3 Bulan
              </SelectItem>
              <SelectItem value="project" className="rounded-lg">
                Per Workspace
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          {isProjectMode ? (
            <BarChart data={projectChartData}>
              <CartesianGrid vertical={false} opacity={0.15} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(dataMax + 1, 4)]}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="todo" name="To Do" fill="var(--muted-foreground)" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
              <Bar dataKey="in_progress" name="In Progress" fill="var(--muted-foreground)" fillOpacity={0.65} radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Tugas Selesai" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--foreground)"
                    stopOpacity={0.14}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--foreground)"
                    stopOpacity={0.01}
                  />
                </linearGradient>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--muted-foreground)"
                    stopOpacity={0.14}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--muted-foreground)"
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} opacity={0.15} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(dataMax + 2, 4)]}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("id-ID", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="created"
                type="linear"
                name="Tugas Dibuat"
                fill="url(#fillCreated)"
                stroke="var(--foreground)"
                strokeWidth={1.5}
              />
              <Area
                dataKey="completed"
                type="linear"
                name="Tugas Selesai"
                fill="url(#fillCompleted)"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

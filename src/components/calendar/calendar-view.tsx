"use client";

import * as React from "react";
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addDays,
  subDays,
  parseISO,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";
import { Todo, Project, Status, Priority, Subtask, Workspace } from "@/types";
import { TaskDialog } from "@/components/modals/task-dialog";
import { DayDetailDialog } from "./day-detail-dialog";
import { toast } from "sonner";

interface CalendarViewProps {
  workspace?: Workspace;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace?: (id: string) => void;
  onNavigateToWorkspace?: (workspaceId: string, todoId?: string) => void;
  todos: Todo[];
  projects: Project[];
  onUpdateTodos: (todos: Todo[]) => void;
  onAddTask?: (date?: string) => void;
}

export function CalendarView({
  workspaces = [],
  activeWorkspaceId,
  onSelectWorkspace,
  onNavigateToWorkspace,
  todos,
  projects,
  onUpdateTodos,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = React.useState<string | "all">(
    "all"
  );
  const [viewMode, setViewMode] = React.useState<"month" | "week">("month");

  // Day Detail Dialog
  const [selectedDayForDetail, setSelectedDayForDetail] = React.useState<Date | null>(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = React.useState(false);

  // Task Dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);

  // Project map for quick lookup
  const projectMap = React.useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  // Navigate months & years
  const handlePrevMonth = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate((prev) => subDays(prev, 7));
    }
  };

  const handleNextMonth = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 7));
    }
  };

  const handlePrevYear = () => {
    setCurrentDate((prev) => subYears(prev, 1));
  };

  const handleNextYear = () => {
    setCurrentDate((prev) => addYears(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Senin awal minggu
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      // Week mode
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  // Filtered tasks
  const scheduledTodos = React.useMemo(() => {
    return todos.filter((t) => {
      if (!t.due_date) return false;
      if (selectedWorkspaceFilter !== "all") {
        const project = projectMap.get(t.project_id);
        if (project && project.workspace_id !== selectedWorkspaceFilter) {
          return false;
        }
      }
      return true;
    });
  }, [todos, selectedWorkspaceFilter, projectMap]);

  // Metric calculation for top cards (Rich, Matching SectionCards Style)
  const stats = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const thisMonthTodos = scheduledTodos.filter((t) => {
      if (!t.due_date) return false;
      try {
        const d = parseISO(t.due_date);
        return d >= monthStart && d <= monthEnd;
      } catch {
        return false;
      }
    });

    const totalScheduled = thisMonthTodos.length;
    const highPriority = thisMonthTodos.filter((t) => t.priority === "high").length;
    const doneCount = thisMonthTodos.filter((t) => t.status === "done").length;

    // Due this week
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const dueThisWeek = scheduledTodos.filter((t) => {
      if (!t.due_date) return false;
      try {
        const d = parseISO(t.due_date);
        return d >= weekStart && d <= weekEnd;
      } catch {
        return false;
      }
    }).length;

    return { totalScheduled, highPriority, doneCount, dueThisWeek };
  }, [scheduledTodos, currentDate]);

  // Handlers for Day Click -> Opens Day Detail Dialog
  const handleDayClick = (day: Date) => {
    setSelectedDayForDetail(day);
    setIsDayDetailOpen(true);
  };

  const handleTaskClick = (e: React.MouseEvent, todo: Todo) => {
    e.stopPropagation();
    setEditingTodo(todo);
    setIsTaskDialogOpen(true);
  };

  const handleToggleStatus = (todoId: string, currentStatus: Status) => {
    let newStatus: Status = "todo";
    if (currentStatus === "todo") {
      newStatus = "in_progress";
    } else if (currentStatus === "in_progress") {
      newStatus = "done";
    } else {
      newStatus = "todo";
    }
    const updated = todos.map((t) =>
      t.id === todoId ? { ...t, status: newStatus } : t
    );
    onUpdateTodos(updated);
  };

  const handleDeleteTask = (todoId: string) => {
    const updated = todos.filter((t) => t.id !== todoId);
    onUpdateTodos(updated);
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
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (todoData.due_date && todoData.due_date < todayStr) {
      toast.error("Batas waktu tidak boleh sebelum hari ini.");
      return;
    }

    if (todoData.id) {
      const updated = todos.map((t) =>
        t.id === todoData.id ? { ...t, ...todoData } : t
      );
      onUpdateTodos(updated);
    } else {
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
    }
  };

  const currentWs = workspaces.find((w) =>
    w.id === (selectedWorkspaceFilter === "all" ? activeWorkspaceId : selectedWorkspaceFilter)
  );

  const dayHeaders = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Page with Workspace Indicator */}
      <div className="px-4 lg:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {currentWs && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              <Layers className="size-3.5 text-primary" />
              <span>Workspace: {currentWs.name}</span>
            </div>
          )}
          <h2 className="text-2xl font-bold tracking-tight">Calendar Schedule</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau seluruh jadwal tugas dan tenggat waktu per project dalam satu kalender.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTodo(null);
            setIsTaskDialogOpen(true);
          }}
          className="gap-1.5 self-start sm:self-auto h-9 font-medium shadow-xs"
        >
          <Plus className="size-4" />
          <span>Tambah Task Baru</span>
        </Button>
      </div>

      {/* 2. Top Summary Metric Cards (Desain Selaras dengan Overview & Workspace) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        {/* Card 1: Total Terjadwal */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Terjadwal</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.totalScheduled}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CalendarDays className="size-3" />
                {format(currentDate, "MMMM", { locale: idLocale })}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Agenda tugas kalender <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Bulan {format(currentDate, "MMMM yyyy", { locale: idLocale })}
            </div>
          </CardFooter>
        </Card>

        {/* Card 2: Tenggat Pekan Ini */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Tenggat Pekan Ini</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.dueThisWeek}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Clock className="size-3" />
                7 Hari
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Perlu segera diselesaikan <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Jatuh tempo dalam 7 hari ke depan
            </div>
          </CardFooter>
        </Card>

        {/* Card 3: Prioritas Tinggi */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Prioritas Tinggi</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.highPriority}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {stats.highPriority > 0 ? (
                  <TrendingDownIcon />
                ) : (
                  <TrendingUpIcon />
                )}
                {stats.highPriority > 0 ? "Mendesak" : "Terkendali"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {stats.highPriority > 0
                ? "Tugas mendesak belum selesai"
                : "Semua prioritas aman"}{" "}
              {stats.highPriority > 0 ? (
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

        {/* Card 4: Selesai Dikerjakan */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Selesai Dikerjakan</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.doneCount}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                {stats.totalScheduled > 0
                  ? Math.round((stats.doneCount / stats.totalScheduled) * 100)
                  : 0}
                %
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Penyelesaian di bulan ini <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {stats.doneCount} dari {stats.totalScheduled} tugas tuntas
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 3. Controls Bar: Navigasi Bulan & Tahun Jelas + Switcher + Filter Project */}
      <div className="px-4 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Controls: Year & Month */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Stepper */}
          <div className="flex items-center rounded-lg border bg-card p-1 shadow-2xs">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-md"
              onClick={handlePrevYear}
              title="Tahun Sebelumnya"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <span className="text-xs font-bold px-2 tabular-nums">
              {format(currentDate, "yyyy")}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-md"
              onClick={handleNextYear}
              title="Tahun Berikutnya"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>

          {/* Month Stepper */}
          <div className="flex items-center rounded-lg border bg-card p-1 shadow-2xs">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-md"
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-7 text-xs font-semibold px-2.5"
            >
              Hari Ini
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-md"
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Label Bulan & Tahun Terpampang Jelas */}
          <h3 className="text-lg font-bold tracking-tight capitalize pl-1">
            {format(currentDate, "MMMM yyyy", { locale: idLocale })}
          </h3>
        </div>

        {/* View Switcher & Filter Projects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Workspace */}
          {workspaces.length > 0 && (
            <Select
              value={selectedWorkspaceFilter}
              onValueChange={(val) => {
                if (val) {
                  setSelectedWorkspaceFilter(val);
                  if (val !== "all") {
                    onSelectWorkspace?.(val);
                  }
                }
              }}
            >
              <SelectTrigger className="h-7 text-xs w-36 font-medium">
                <Layers className="size-3 mr-1 text-primary shrink-0" />
                <SelectValue placeholder="Workspace">
                  {(val: string | null) => {
                    if (val === "all") return "Semua Workspace";
                    return workspaces.find((w) => w.id === val)?.name ?? "Workspace";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Workspace
                </SelectItem>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id} className="text-xs">
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border bg-card p-0.5 shadow-2xs">
            <Button
              size="sm"
              variant={viewMode === "month" ? "default" : "ghost"}
              onClick={() => setViewMode("month")}
              className="h-7 text-xs px-3"
            >
              Bulan
            </Button>
            <Button
              size="sm"
              variant={viewMode === "week" ? "default" : "ghost"}
              onClick={() => setViewMode("week")}
              className="h-7 text-xs px-3"
            >
              Minggu
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Large Calendar Grid (Kalender Gede & Bersih) */}
      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold py-2.5 text-muted-foreground">
            {dayHeaders.map((day) => (
              <div key={day} className="truncate px-1">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y border-b">
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              // Find tasks for this day (robust check)
              const dayTasks = scheduledTodos.filter((t) => {
                if (!t.due_date) return false;
                return t.due_date === dateStr || t.due_date.startsWith(dateStr);
              });

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(day)}
                  className={`group relative min-h-[120px] sm:min-h-[140px] p-2 transition-all hover:bg-muted/40 cursor-pointer flex flex-col justify-between ${!isCurrentMonth ? "bg-muted/15 opacity-40" : "bg-card"
                    }`}
                  title={`Klik untuk melihat detail agenda tanggal ${format(day, "d MMMM yyyy", { locale: idLocale })}`}
                >
                  {/* Date Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold rounded-full size-6 transition-transform group-hover:scale-110 ${isTodayDate
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-foreground/80 group-hover:text-primary"
                        }`}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Task count pill if tasks exist */}
                    {dayTasks.length > 0 ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {dayTasks.length} task
                      </span>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 text-[11px] text-muted-foreground transition-opacity font-bold">
                        +
                      </span>
                    )}
                  </div>

                  {/* Tasks inside Day Cell */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[90px] scrollbar-none pt-1">
                    {dayTasks.map((task) => {
                      const project = projectMap.get(task.project_id);
                      const isDone = task.status === "done";
                      const projectColor = project?.color ?? "#6366f1";

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => handleTaskClick(e, task)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all hover:scale-[1.02] shadow-2xs border ${isDone
                            ? "opacity-60 bg-muted line-through text-muted-foreground border-transparent"
                            : "text-foreground hover:shadow-xs"
                            }`}
                          style={{
                            borderLeftColor: projectColor,
                            borderLeftWidth: "3px",
                            backgroundColor: isDone ? undefined : `${projectColor}15`,
                          }}
                          title={`${task.title} - Klik untuk edit`}
                        >
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: projectColor }}
                          />
                          <span className="truncate flex-1 font-semibold">
                            {task.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Dialog Detail Tanggal (Day Detail Agenda) */}
      <DayDetailDialog
        open={isDayDetailOpen}
        onOpenChange={setIsDayDetailOpen}
        selectedDate={selectedDayForDetail}
        todos={todos}
        projects={projects}
        workspaces={workspaces}
        onToggleStatus={handleToggleStatus}
        onNavigateToWorkspace={onNavigateToWorkspace}
        onEditTask={(todo) => {
          setEditingTodo(todo);
          setIsTaskDialogOpen(true);
        }}
        onDeleteTask={handleDeleteTask}
        onAddNewTask={(dateStr) => {
          setEditingTodo({
            id: "",
            title: "",
            project_id: projects[0]?.id ?? "",
            status: "todo",
            priority: "medium",
            due_date: dateStr,
          });
          setIsTaskDialogOpen(true);
        }}
      />

      {/* Task Dialog for Editing or Creating */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        projects={projects}
        defaultStatus="todo"
        editingTodo={editingTodo}
        onSaveTodo={handleSaveTodo}
      />
    </div>
  );
}

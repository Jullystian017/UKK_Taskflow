"use client";

import * as React from "react";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { Todo } from "@/types";

interface InsightCardProps {
  todos: Todo[];
  workspaceName?: string;
  onOpenAiChat?: () => void;
}

export function InsightCard({
  todos,
  workspaceName = "My Tasks",
  onOpenAiChat,
}: InsightCardProps) {
  // Generate smart dynamic insight based on tasks
  const highPriorityTodo = todos.filter(
    (t) => t.priority === "high" && t.status !== "done"
  );
  const doneCount = todos.filter((t) => t.status === "done").length;
  const inProgressCount = todos.filter((t) => t.status === "in_progress").length;

  // Cek pengingat jadwal hari ini dan tugas terlambat
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dueTodayTasks = todos.filter((t) => t.due_date === todayStr && t.status !== "done");
  const overdueTasks = todos.filter((t) => Boolean(t.due_date && t.due_date < todayStr && t.status !== "done"));

  let insightText = "";
  if (todos.length === 0) {
    insightText = `Belum ada task di workspace "${workspaceName}". Mulai dengan membuat task pertamamu atau curhat ke AI Assistant!`;
  } else if (overdueTasks.length > 0) {
    insightText = `Perhatian: Ada ${overdueTasks.length} tugas yang telah melewati tenggat waktu (misal: "${overdueTasks[0].title}"). Sebaiknya segera selesaikan atau jadwalkan ulang.`;
  } else if (dueTodayTasks.length > 0) {
    insightText = `Pengingat Hari Ini: Kamu memiliki ${dueTodayTasks.length} tugas yang jatuh tempo hari ini (misal: "${dueTodayTasks[0].title}"). Selesaikan hari ini agar tidak menumpuk!`;
  } else if (doneCount === todos.length) {
    insightText = `Luar biasa! Semua tugas (${doneCount}) di workspace ini telah selesai dikerjakan. Saatnya istirahat atau buat task baru!`;
  } else if (highPriorityTodo.length > 0) {
    insightText = `Ada ${highPriorityTodo.length} task prioritas tinggi yang belum selesai (misal: "${highPriorityTodo[0].title}"). Sebaiknya prioritaskan ini terlebih dahulu hari ini.`;
  } else if (inProgressCount > 0) {
    insightText = `Kamu memiliki ${inProgressCount} tugas yang sedang berlangsung. Pertahankan fokus untuk menyelesaikannya!`;
  } else {
    insightText = `Ada ${todos.length} tugas terdaftar. Pilih satu task di kolom To Do dan pindahkan ke In Progress untuk mulai bekerja.`;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/40 dark:bg-muted/20 p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-background border border-border text-foreground shrink-0 mt-0.5 shadow-2xs">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Lightbulb className="size-3.5 text-primary" />
              <span>AI TaskFlow Insight</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 font-normal leading-relaxed">
              {insightText}
            </p>
          </div>
        </div>

        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            suppressHydrationWarning
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors shrink-0 self-end sm:self-center"
          >
            <span>Tanya AI Chat</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useDashboard } from "@/context/dashboard-context";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";

export default function OverviewPage() {
  const { todos, projects, workspaces, activeWorkspace } = useDashboard();

  // Konversi data nyata todos ke format yang kompatibel dengan TanStack DataTable
  const tableData = React.useMemo(() => {
    return todos
      .filter((t) => !t.is_event)
      .map((todo, idx) => {
        const project = projects.find((p) => p.id === todo.project_id);
        const workspace = workspaces.find((w) => w.id === project?.workspace_id);

        return {
          id: idx + 1,
          todoId: todo.id,
          header: todo.title,
          type: project?.name || "Umum",
          status:
            todo.status === "done"
              ? "Done"
              : todo.status === "in_progress"
              ? "In Progress"
              : "To Do",
          target:
            todo.priority === "high"
              ? "High"
              : todo.priority === "medium"
              ? "Medium"
              : "Low",
          limit: todo.due_date || "-",
          reviewer: workspace?.name || activeWorkspace?.name || "My Tasks",
        };
      });
  }, [todos, projects, workspaces, activeWorkspace]);

  return (
    <div className="flex flex-1 flex-col py-4 md:py-6 gap-4 md:gap-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={tableData} />
    </div>
  );
}

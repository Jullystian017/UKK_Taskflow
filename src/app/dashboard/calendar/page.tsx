"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/context/dashboard-context";
import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  const router = useRouter();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    todos,
    projects,
    handleSyncTodos,
  } = useDashboard();

  return (
    <div className="py-4 md:py-6">
      <CalendarView
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={setActiveWorkspaceId}
        onNavigateToWorkspace={(wsId: string) => {
          setActiveWorkspaceId(wsId);
          router.push(`/dashboard/workspaces/${wsId}`);
        }}
        todos={todos}
        projects={projects}
        onUpdateTodos={handleSyncTodos}
        onAddTask={() => {}}
      />
    </div>
  );
}

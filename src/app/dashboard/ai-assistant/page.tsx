"use client";

import * as React from "react";
import { useDashboard } from "@/context/dashboard-context";
import { AiAssistantView } from "@/components/ai/ai-assistant-view";

export default function AiAssistantPage() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    todos,
    projects,
    handleSyncTodos,
  } = useDashboard();

  return (
    <AiAssistantView
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      activeWorkspace={activeWorkspace}
      todos={todos}
      projects={projects}
      onSyncTodos={handleSyncTodos}
    />
  );
}

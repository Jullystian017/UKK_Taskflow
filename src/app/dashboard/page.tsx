"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/context/dashboard-context";
import { WorkspaceView } from "@/components/workspace/workspace-view";

export default function DashboardPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    workspaces,
    activeWorkspaceId,
    handleSelectWorkspace,
    handleCreateWorkspace,
    currentWorkspaceProjects,
    currentWorkspaceTodos,
    todos,
    projects,
    handleSyncTodos,
    handleCreateProject,
  } = useDashboard();

  return (
    <div className="py-4 md:py-6">
      <WorkspaceView
        workspace={activeWorkspace}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        projects={currentWorkspaceProjects}
        todos={currentWorkspaceTodos}
        onUpdateTodos={(workspaceUpdatedTodos) => {
          const otherWsTodos = todos.filter((t) => {
            const proj = projects.find((p) => p.id === t.project_id);
            return proj?.workspace_id !== activeWorkspaceId;
          });
          handleSyncTodos([...otherWsTodos, ...workspaceUpdatedTodos]);
        }}
        onCreateProject={handleCreateProject}
        onOpenAiChat={() => router.push("/dashboard/ai-assistant")}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useDashboard } from "@/context/dashboard-context";
import { WorkspaceView } from "@/components/workspace/workspace-view";

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const routeWorkspaceId = params?.id as string | undefined;

  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    handleSelectWorkspace,
    handleCreateWorkspace,
    todos,
    projects,
    handleSyncTodos,
    handleCreateProject,
  } = useDashboard();

  // Pastikan activeWorkspaceId sesuai rute URL
  React.useEffect(() => {
    if (routeWorkspaceId && routeWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(routeWorkspaceId);
    }
  }, [routeWorkspaceId, activeWorkspaceId, setActiveWorkspaceId]);

  const targetWorkspace =
    workspaces.find((w) => w.id === routeWorkspaceId) ??
    workspaces.find((w) => w.id === activeWorkspaceId) ??
    workspaces[0] ?? { id: routeWorkspaceId || "ws-default", name: "Workspace" };

  const currentWorkspaceProjects = projects.filter(
    (p) => p.workspace_id === targetWorkspace.id
  );

  const currentWorkspaceTodos = todos.filter((t) => {
    if (t.is_event) return false;
    const proj = projects.find((p) => p.id === t.project_id);
    return proj?.workspace_id === targetWorkspace.id;
  });

  return (
    <div className="py-4 md:py-6">
      <WorkspaceView
        workspace={targetWorkspace}
        workspaces={workspaces}
        activeWorkspaceId={targetWorkspace.id}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        projects={currentWorkspaceProjects}
        todos={currentWorkspaceTodos}
        onUpdateTodos={(workspaceUpdatedTodos) => {
          const otherWsTodos = todos.filter((t) => {
            const proj = projects.find((p) => p.id === t.project_id);
            return proj?.workspace_id !== targetWorkspace.id;
          });
          handleSyncTodos([...otherWsTodos, ...workspaceUpdatedTodos]);
        }}
        onCreateProject={handleCreateProject}
        onOpenAiChat={() => router.push("/dashboard/ai-assistant")}
      />
    </div>
  );
}

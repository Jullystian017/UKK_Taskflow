"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/context/dashboard-context";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader, BreadcrumbCrumb } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TaskDialog } from "@/components/modals/task-dialog";
import { Toaster } from "@/components/ui/sonner";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    workspaceTaskCounts,
    handleSelectWorkspace,
    handleCreateWorkspace,
    handleDeleteWorkspace,
    currentUserProfile,
    isQuickCreateOpen,
    setIsQuickCreateOpen,
    handleQuickSaveTodo,
    projects,
  } = useDashboard();

  // Hitung Breadcrumbs Dinamis berdasarkan URL aktif dan Workspace
  const breadcrumbs: BreadcrumbCrumb[] = React.useMemo(() => {
    if (pathname === "/dashboard/overview") {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Overview" },
      ];
    }
    if (pathname === "/dashboard/calendar") {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kalender", href: "/dashboard/calendar" },
        { label: activeWorkspace.name },
      ];
    }
    if (pathname === "/dashboard/ai-assistant") {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "AI Assistant" },
      ];
    }
    if (pathname === "/dashboard/profile") {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Pengaturan" },
        { label: "Profil Pengguna" },
      ];
    }

    // Default: Workspace view (/dashboard atau /dashboard/workspaces/[id])
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Workspaces", href: "/dashboard" },
      { label: activeWorkspace.name },
    ];
  }, [pathname, activeWorkspace.name]);

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        workspaceTaskCounts={workspaceTaskCounts}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        currentUser={currentUserProfile ?? undefined}
      />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <main className="flex-1">{children}</main>
      </SidebarInset>

      {/* Modal Quick Create Global Task */}
      <TaskDialog
        open={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        workspaces={workspaces}
        projects={projects}
        defaultWorkspaceId={activeWorkspaceId}
        showWorkspaceSelect={true}
        defaultStatus="todo"
        editingTodo={null}
        onSaveTodo={handleQuickSaveTodo}
      />

      <Toaster position="bottom-right" />
    </SidebarProvider>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}

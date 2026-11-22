"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Command, CirclePlus } from "lucide-react";
import { NavViews } from "@/components/sidebar/nav-views";
import { NavWorkspaces } from "@/components/sidebar/nav-workspaces";
import { NavUser } from "@/components/nav-user";
import { WorkspaceDialog } from "@/components/modals/workspace-dialog";
import { Workspace, ActiveView } from "@/types";

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "My Tasks" },
  { id: "ws-2", name: "School / UKK" },
  { id: "ws-3", name: "Personal Work" },
];

const DEFAULT_USER = {
  name: "Siswa UKK",
  email: "siswa@taskflow.dev",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  workspaceTaskCounts?: Record<string, number>;
  onSelectWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
  onDeleteWorkspace?: (id: string) => void;
  activeView?: ActiveView;
  onSelectView?: (view: ActiveView) => void;
  onQuickCreate?: () => void;
  onOpenAiChat?: () => void;
  onSelectProfile?: () => void;
  currentUser?: { name: string; email: string; avatar: string };
}

export function AppSidebar({
  workspaces: propWorkspaces,
  activeWorkspaceId: propActiveWsId,
  workspaceTaskCounts,
  onSelectWorkspace: propOnSelectWs,
  onCreateWorkspace: propOnCreateWs,
  onDeleteWorkspace: propOnDeleteWs,
  activeView: propActiveView,
  onSelectView: propOnSelectView,
  onQuickCreate,
  onOpenAiChat,
  onSelectProfile: propOnSelectProfile,
  currentUser: propCurrentUser,
  ...props
}: AppSidebarProps) {
  // Workspaces state
  const [internalWorkspaces, setInternalWorkspaces] = React.useState<Workspace[]>(DEFAULT_WORKSPACES);
  const workspaces = propWorkspaces ?? internalWorkspaces;

  const [internalActiveWsId, setInternalActiveWsId] = React.useState<string>(DEFAULT_WORKSPACES[0].id);
  const activeWorkspaceId = propActiveWsId ?? internalActiveWsId;

  // View state
  const [internalActiveView, setInternalActiveView] = React.useState<ActiveView>("workspace");
  const activeView = propActiveView ?? internalActiveView;

  // Dialog state for workspace
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = React.useState(false);

  const pathname = usePathname();
  const isWorkspaceRoute =
    pathname === "/dashboard" || (pathname?.startsWith("/dashboard/workspaces") ?? false) || activeView === "workspace";

  // Handlers
  const handleSelectWorkspace = (id: string) => {
    setInternalActiveWsId(id);
    setInternalActiveView("workspace");
    propOnSelectWs?.(id);
    propOnSelectView?.("workspace");
  };

  const handleSelectView = (view: ActiveView) => {
    setInternalActiveView(view);
    propOnSelectView?.(view);
  };

  const handleCreateWorkspace = (name: string) => {
    if (propOnCreateWs) {
      propOnCreateWs(name);
    } else {
      const newWs: Workspace = {
        id: `ws-${Date.now()}`,
        name,
      };
      setInternalWorkspaces((prev) => [...prev, newWs]);
      handleSelectWorkspace(newWs.id);
    }
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (propOnDeleteWs) {
      propOnDeleteWs(workspaceId);
    } else {
      setInternalWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
      if (activeWorkspaceId === workspaceId) {
        const remaining = workspaces.filter((ws) => ws.id !== workspaceId);
        if (remaining.length > 0) {
          handleSelectWorkspace(remaining[0].id);
        }
      }
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        {/* 1. Header: ⌘ Brand Logo (Simetris & Sempurna saat Collapsed) */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/dashboard" className="flex items-center gap-2" />}
                tooltip="TaskFlow"
                className="h-10 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8!"
              >
                <div className="flex size-8 shrink-0 items-center justify-center">
                  <Command className="size-4.5 text-foreground" />
                </div>
                <div className="flex flex-col text-left justify-center group-data-[collapsible=icon]:hidden leading-none">
                  <span className="font-semibold text-sm tracking-tight text-foreground leading-tight">
                    TaskFlow
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Productivity Suite
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* 2. Content: Quick Create + Views + Workspaces (Tanpa Garis Pemisah) */}
        <SidebarContent className="gap-0">
          {/* Tombol Quick Create Task */}
          <SidebarGroup className="pt-0 pb-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onQuickCreate}
                    tooltip="Quick Create Task"
                    className="h-9 w-full bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground font-medium rounded-lg group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8!"
                  >
                    <CirclePlus className="size-4.5 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden font-semibold text-xs tracking-wide">
                      Quick Create
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Navigation Views */}
          <NavViews
            activeView={activeView}
            onSelectView={handleSelectView}
            onOpenAiChat={onOpenAiChat}
          />

          {/* Workspaces Section */}
          <NavWorkspaces
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            isWorkspaceViewActive={isWorkspaceRoute}
            workspaceTaskCounts={workspaceTaskCounts}
            onSelectWorkspace={handleSelectWorkspace}
            onOpenNewWorkspace={() => setIsWorkspaceDialogOpen(true)}
            onDeleteWorkspace={handleDeleteWorkspace}
          />
        </SidebarContent>

        {/* 3. Footer: User Profile */}
        <SidebarFooter>
          <NavUser
            user={propCurrentUser ?? DEFAULT_USER}
            onSelectProfile={() => {
              handleSelectView("profile");
              propOnSelectProfile?.();
            }}
          />
        </SidebarFooter>
      </Sidebar>

      {/* Modal Buat Workspace Baru */}
      <WorkspaceDialog
        open={isWorkspaceDialogOpen}
        onOpenChange={setIsWorkspaceDialogOpen}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </>
  );
}

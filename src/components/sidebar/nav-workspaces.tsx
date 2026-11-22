"use client";

import * as React from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, MoreHorizontal, Trash2, FolderKanban, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Workspace } from "@/types";

interface NavWorkspacesProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isWorkspaceViewActive?: boolean;
  workspaceTaskCounts?: Record<string, number>;
  onSelectWorkspace: (id: string) => void;
  onOpenNewWorkspace: () => void;
  onDeleteWorkspace?: (id: string) => void;
}

export function NavWorkspaces({
  workspaces,
  activeWorkspaceId,
  isWorkspaceViewActive = true,
  workspaceTaskCounts = {},
  onSelectWorkspace,
  onOpenNewWorkspace,
  onDeleteWorkspace,
}: NavWorkspacesProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter workspaces if query is present
  const filteredWorkspaces = React.useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    return workspaces.filter((ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [workspaces, searchQuery]);

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between pr-2 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-1.5">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Workspaces
          </SidebarGroupLabel>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
            {workspaces.length}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-5 rounded hover:bg-sidebar-accent"
          onClick={onOpenNewWorkspace}
          title="Tambah Workspace Baru"
        >
          <Plus className="size-3.5 text-muted-foreground hover:text-foreground" />
          <span className="sr-only">Tambah Workspace</span>
        </Button>
      </div>

      {/* Search Workspace jika lebih dari 3 workspace (UX optimal untuk banyak workspace) */}
      {workspaces.length >= 4 && (
        <div className="px-2 pt-1 pb-1.5 group-data-[collapsible=icon]:hidden">
          <div className="relative">
            <Search className="absolute left-2 top-2 size-3 text-muted-foreground" />
            <Input
              placeholder="Cari workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs bg-sidebar-accent/40 border-sidebar-border"
            />
          </div>
        </div>
      )}

      {/* Scrollable list container jika workspace banyak */}
      <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-muted pr-0.5">
        <SidebarMenu>
          {filteredWorkspaces.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              {searchQuery ? "Workspace tidak ditemukan" : "Belum ada workspace."}
            </div>
          ) : (
            filteredWorkspaces.map((ws) => {
              const isActive = isWorkspaceViewActive && ws.id === activeWorkspaceId;
              const taskCount = workspaceTaskCounts[ws.id];

              return (
                <SidebarMenuItem key={ws.id}>
                  <SidebarMenuButton
                    render={<Link href={`/dashboard/workspaces/${ws.id}`} />}
                    isActive={isActive}
                    onClick={() => onSelectWorkspace(ws.id)}
                    tooltip={ws.name}
                    className="gap-2.5 font-medium group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8!"
                  >
                    <FolderKanban className="size-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1 text-sm group-data-[collapsible=icon]:hidden">
                      {ws.name}
                    </span>
                    {taskCount !== undefined && taskCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground group-data-[collapsible=icon]:hidden">
                        {taskCount}
                      </span>
                    )}
                    {isActive && <Check className="size-3.5 text-primary shrink-0 group-data-[collapsible=icon]:hidden" />}
                  </SidebarMenuButton>

                  {onDeleteWorkspace && workspaces.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuAction
                            showOnHover
                            title="Opsi Workspace"
                            className="aria-expanded:bg-muted"
                          />
                        }
                      >
                        <MoreHorizontal className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() => onDeleteWorkspace(ws.id)}
                          className="text-destructive focus:text-destructive cursor-pointer gap-2"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Hapus</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              );
            })
          )}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  );
}

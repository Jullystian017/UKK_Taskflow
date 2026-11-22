"use client";

import * as React from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from "@/types";

interface NavProjectsProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  onDeleteProject?: (projectId: string) => void;
}

export function NavProjects({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProject,
  onDeleteProject,
}: NavProjectsProps) {
  return (
    <SidebarGroup>
      <div className="flex items-center justify-between pr-2">
        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          Projects
        </SidebarGroupLabel>
        <Button
          size="icon"
          variant="ghost"
          className="size-5 rounded hover:bg-sidebar-accent"
          onClick={onOpenNewProject}
          title="Tambah Project Baru"
        >
          <Plus className="size-3.5 text-muted-foreground hover:text-foreground" />
          <span className="sr-only">Tambah Project</span>
        </Button>
      </div>

      <SidebarMenu>
        {projects.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            Belum ada project. Klik <span className="font-semibold">+</span> untuk buat baru.
          </div>
        ) : (
          projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <SidebarMenuItem key={project.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => onSelectProject(project.id)}
                  tooltip={project.name}
                  className="gap-2.5"
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: project.color }}
                  >
                    #
                  </span>
                  <span className="truncate flex-1 font-medium text-sm">
                    {project.name}
                  </span>
                  {project.task_count !== undefined && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5 py-0 h-4 font-normal"
                    >
                      {project.task_count}
                    </Badge>
                  )}
                  {isActive && <Check className="size-3.5 text-primary shrink-0" />}
                </SidebarMenuButton>

                {onDeleteProject && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuAction
                          showOnHover
                          title="Opsi Project"
                          className="aria-expanded:bg-muted"
                        />
                      }
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={() => onDeleteProject(project.id)}
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
    </SidebarGroup>
  );
}

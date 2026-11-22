"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderPlus, Layers, Check, ChevronDown, FolderKanban } from "lucide-react";
import { Project, Workspace } from "@/types";
import { ProjectDialog } from "@/components/modals/project-dialog";
import { WorkspaceDialog } from "@/components/modals/workspace-dialog";

interface ProjectSectionProps {
  workspaceName: string;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onCreateProject: (name: string, color: string) => void;
}

export function ProjectSection({
  workspaceName,
  workspaces = [],
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
}: ProjectSectionProps) {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = React.useState(false);

  return (
    <div className="px-4 lg:px-6 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          {/* Breadcrumb with Workspace Switcher Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5" /> Workspace
            </span>
            <span className="text-muted-foreground">/</span>

            {workspaces.length > 1 && onSelectWorkspace ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 -ml-1 text-xs font-semibold text-foreground hover:bg-muted gap-1"
                    />
                  }
                >
                  <span>{workspaceName}</span>
                  <ChevronDown className="size-3 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Ganti Workspace
                  </div>
                  {workspaces.map((ws) => (
                    <DropdownMenuItem
                      key={ws.id}
                      onClick={() => onSelectWorkspace(ws.id)}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <FolderKanban className="size-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate">{ws.name}</span>
                      {ws.id === activeWorkspaceId && (
                        <Check className="size-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  {onCreateWorkspace && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsWorkspaceDialogOpen(true)}
                        className="gap-2 cursor-pointer text-xs font-medium text-primary"
                      >
                        <Plus className="size-3.5" />
                        <span>Buat Workspace Baru</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {workspaceName}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold tracking-tight mt-0.5">
            Daftar Projects
          </h2>
        </div>

        {/* Tombol Buat Project Baru di Halaman Workspace */}
        <Button
          size="sm"
          onClick={() => setIsProjectDialogOpen(true)}
          className="gap-1.5 self-start sm:self-auto h-9 font-medium shadow-xs"
        >
          <FolderPlus className="size-4" />
          <span>Buat Project Baru</span>
        </Button>
      </div>

      {/* Filter / List Projects di Halaman (Nama utuh tanpa terpotong ...) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          variant={activeProjectId === null ? "default" : "outline"}
          onClick={() => onSelectProject(null)}
          className="h-8 text-xs font-medium"
        >
          Semua Projects
          <Badge
            variant={activeProjectId === null ? "secondary" : "outline"}
            className="ml-1.5 px-1.5 py-0 text-[10px] font-bold"
          >
            {projects.length}
          </Badge>
        </Button>

        {projects.map((project) => {
          const isActive = activeProjectId === project.id;
          return (
            <Button
              key={project.id}
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => onSelectProject(project.id)}
              className="h-8 text-xs font-medium gap-1.5 whitespace-nowrap"
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
              {/* Tampilkan nama project lengkap tanpa pemotongan truncate sempit */}
              <span className="font-semibold">{project.name}</span>
              {project.task_count !== undefined && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-0.5 px-1.5 py-0 text-[10px] font-bold"
                >
                  {project.task_count}
                </Badge>
              )}
              {isActive && <Check className="size-3 text-current ml-0.5" />}
            </Button>
          );
        })}

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsProjectDialogOpen(true)}
          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 border border-dashed hover:border-solid"
        >
          <Plus className="size-3.5" />
          <span>Tambah</span>
        </Button>
      </div>

      {/* Modal Buat Project */}
      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onCreateProject={onCreateProject}
      />

      {/* Modal Buat Workspace */}
      {onCreateWorkspace && (
        <WorkspaceDialog
          open={isWorkspaceDialogOpen}
          onOpenChange={setIsWorkspaceDialogOpen}
          onCreateWorkspace={onCreateWorkspace}
        />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Clock, Flame, FileDown } from "lucide-react";

interface NavQuickActionsProps {
  onFilterDueSoon?: () => void;
  onFilterHighPriority?: () => void;
  onExportCsv?: () => void;
  activeFilter?: string | null;
}

export function NavQuickActions({
  onFilterDueSoon,
  onFilterHighPriority,
  onExportCsv,
  activeFilter,
}: NavQuickActionsProps) {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
        Filter & Alat
      </SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeFilter === "due-soon"}
            onClick={onFilterDueSoon}
            tooltip="Tenggat Waktu Dekat"
          >
            <Clock className="size-4 text-amber-500" />
            <span>Mendekati Deadline</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeFilter === "high-priority"}
            onClick={onFilterHighPriority}
            tooltip="Prioritas Tinggi"
          >
            <Flame className="size-4 text-rose-500" />
            <span>Prioritas Tinggi</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={onExportCsv}
            tooltip="Export Task ke CSV"
            className="text-muted-foreground hover:text-foreground"
          >
            <FileDown className="size-4" />
            <span>Export ke CSV</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

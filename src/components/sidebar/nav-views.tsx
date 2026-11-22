"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, CalendarDays, Sparkles } from "lucide-react";
import { ActiveView } from "@/types";

interface NavViewsProps {
  activeView?: ActiveView;
  onSelectView?: (view: ActiveView) => void;
  onOpenAiChat?: () => void;
}

export function NavViews({
  activeView,
  onSelectView,
  onOpenAiChat,
}: NavViewsProps) {
  const pathname = usePathname();

  const isOverview = pathname === "/dashboard/overview" || activeView === "overview";
  const isCalendar = pathname === "/dashboard/calendar" || activeView === "calendar";
  const isAiAssistant = pathname === "/dashboard/ai-assistant" || activeView === "ai-chat";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
        Tampilan
      </SidebarGroupLabel>
      <SidebarMenu>
        {/* Dashboard Overview */}
        <SidebarMenuItem>
          <SidebarMenuButton
            render={
              <Link
                href="/dashboard/overview"
                onClick={() => onSelectView?.("overview")}
              />
            }
            isActive={isOverview}
            tooltip="Dashboard Overview"
            className="group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8!"
          >
            <LayoutDashboard className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              Dashboard Overview
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Calendar View */}
        <SidebarMenuItem>
          <SidebarMenuButton
            render={
              <Link
                href="/dashboard/calendar"
                onClick={() => onSelectView?.("calendar")}
              />
            }
            isActive={isCalendar}
            tooltip="Calendar View"
            className="group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8!"
          >
            <CalendarDays className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              Calendar View
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* AI Assistant */}
        <SidebarMenuItem>
          <SidebarMenuButton
            render={
              <Link
                href="/dashboard/ai-assistant"
                onClick={() => {
                  onSelectView?.("ai-chat");
                  onOpenAiChat?.();
                }}
              />
            }
            isActive={isAiAssistant}
            tooltip="AI Assistant"
            className="group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8!"
          >
            <Sparkles className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              AI Assistant
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

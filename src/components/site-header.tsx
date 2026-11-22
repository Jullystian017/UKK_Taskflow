"use client";

import * as React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

interface SiteHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbCrumb[];
  projectColor?: string;
}

export function SiteHeader({
  title = "TaskFlow",
  breadcrumbs,
  projectColor,
}: SiteHeaderProps) {
  const crumbs: BreadcrumbCrumb[] =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : [
          { label: "Dashboard", href: "/dashboard" },
          { label: title },
        ];

  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between border-b px-4 lg:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />

        {/* Breadcrumb Navigation Modern */}
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {isLast && projectColor && (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: projectColor }}
                          />
                        )}
                        <span>{crumb.label}</span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<Link href={crumb.href} />}
                        className="text-xs"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

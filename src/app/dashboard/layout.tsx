import * as React from "react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background text-sm text-muted-foreground">
          Memuat TaskFlow...
        </div>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </React.Suspense>
  );
}

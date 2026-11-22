"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/context/dashboard-context";
import { ProfileView } from "@/components/profile/profile-view";

export default function ProfileDashboardPage() {
  const router = useRouter();
  const { workspaces, projects, todos, setCurrentUserProfile } = useDashboard();

  return (
    <ProfileView
      workspaces={workspaces}
      projects={projects}
      todos={todos}
      onProfileUpdated={(updated) => {
        setCurrentUserProfile((prev) =>
          prev
            ? { ...prev, name: updated.name, avatar: updated.avatar }
            : { name: updated.name, email: "", avatar: updated.avatar }
        );
      }}
      onBackToWorkspace={() => router.push("/dashboard")}
    />
  );
}

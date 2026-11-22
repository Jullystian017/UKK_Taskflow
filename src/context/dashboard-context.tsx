"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Workspace, Project, Todo, Priority, Status, Subtask } from "@/types";
import {
  ensureUserStarterData,
  insertWorkspace,
  removeWorkspace,
  insertProject,
  saveTodo,
  updateTodoStatus,
  removeTodo,
} from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CurrentUserProfile {
  name: string;
  email: string;
  avatar: string;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
}

interface DashboardContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  projects: Project[];
  todos: Todo[];
  currentUserProfile: CurrentUserProfile | null;
  activeWorkspace: Workspace;
  currentWorkspaceProjects: Project[];
  currentWorkspaceTodos: Todo[];
  workspaceTaskCounts: Record<string, number>;
  isQuickCreateOpen: boolean;
  isLoadingData: boolean;
  aiMessages: AiChatMessage[];
  setAiMessages: React.Dispatch<React.SetStateAction<AiChatMessage[]>>;
  setActiveWorkspaceId: (id: string) => void;
  handleSelectWorkspace: (id: string) => void;
  handleCreateWorkspace: (name: string) => Promise<void>;
  handleDeleteWorkspace: (id: string) => Promise<void>;
  handleCreateProject: (name: string, color: string) => Promise<void>;
  handleSyncTodos: (updatedTodos: Todo[]) => Promise<void>;
  handleQuickSaveTodo: (todoData: {
    title: string;
    description: string;
    project_id: string;
    priority: Priority;
    status: Status;
    due_date?: string | null;
    subtasks: Subtask[];
  }) => void;
  setIsQuickCreateOpen: (open: boolean) => void;
  setCurrentUserProfile: React.Dispatch<React.SetStateAction<CurrentUserProfile | null>>;
}

declare global {
  var __dashboardContextInstance: React.Context<DashboardContextType | null> | undefined;
}

const DashboardContext: React.Context<DashboardContextType | null> =
  globalThis.__dashboardContextInstance ||
  React.createContext<DashboardContextType | null>(null);

if (process.env.NODE_ENV !== "production") {
  globalThis.__dashboardContextInstance = DashboardContext;
}

// External store untuk riwayat chat AI (React 19 & SSR safe tanpa cascading renders)
let memoryAiMessages: AiChatMessage[] | null = null;
const serverAiMessages: AiChatMessage[] = [];

function subscribeAiMessages(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("taskflow_ai_update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("taskflow_ai_update", callback);
  };
}

function getAiMessagesSnapshot(): AiChatMessage[] {
  if (memoryAiMessages !== null) return memoryAiMessages;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("taskflow_ai_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          memoryAiMessages = parsed.map((m, idx) => {
            let id = m.id || `msg-${idx}`;
            if (seen.has(id)) {
              id = `${id}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            }
            seen.add(id);
            return { ...m, id };
          });
          return memoryAiMessages;
        }
      }
    } catch {
      // ignore
    }
  }
  memoryAiMessages = [];
  return memoryAiMessages;
}

function getAiMessagesServerSnapshot(): AiChatMessage[] {
  return serverAiMessages;
}

function saveAiMessages(updater: React.SetStateAction<AiChatMessage[]>) {
  const current = getAiMessagesSnapshot();
  const next = typeof updater === "function" ? updater(current) : updater;
  memoryAiMessages = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("taskflow_ai_chat_history", JSON.stringify(next));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("taskflow_ai_update"));
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Inisialisasi cepat dari cache lokal agar tidak pernah kedip kosong
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("taskflow_cache_workspaces");
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<string>("");
  const [projects, setProjects] = React.useState<Project[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("taskflow_cache_projects");
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [todos, setTodos] = React.useState<Todo[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("taskflow_cache_todos");
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [isQuickCreateOpen, setIsQuickCreateOpen] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<CurrentUserProfile | null>(null);

  // Chat AI history yang tidak hilang saat pindah-pindah halaman atau refresh
  const aiMessages = React.useSyncExternalStore(
    subscribeAiMessages,
    getAiMessagesSnapshot,
    getAiMessagesServerSnapshot
  );

  const setAiMessages = React.useCallback(
    (updater: React.SetStateAction<AiChatMessage[]>) => {
      saveAiMessages(updater);
    },
    []
  );

  // 1. Ambil profil pengguna terotentikasi
  React.useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna";
          const avatar =
            user.user_metadata?.avatar_url ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces";
          setCurrentUserProfile({
            name,
            email: user.email || "",
            avatar,
          });
        }
      } catch (err) {
        console.warn("Gagal memuat profil pengguna:", err);
      }
    }
    loadUserProfile();
  }, []);

  // 2. Ambil data database Supabase (Workspace, Proyek, Tasks)
  React.useEffect(() => {
    async function loadSupabaseData() {
      try {
        const starterData = await ensureUserStarterData();
        if (starterData) {
          setWorkspaces(starterData.workspaces);
          setProjects(starterData.projects);
          setTodos(starterData.todos);
          if (starterData.workspaces.length > 0) {
            setActiveWorkspaceId((prev) => prev || starterData.workspaces[0].id);
          }
          try {
            localStorage.setItem("taskflow_cache_workspaces", JSON.stringify(starterData.workspaces));
            localStorage.setItem("taskflow_cache_projects", JSON.stringify(starterData.projects));
            localStorage.setItem("taskflow_cache_todos", JSON.stringify(starterData.todos));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn("Gagal memuat data dari Supabase:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadSupabaseData();
  }, []);

  // Hitung activeWorkspace secara dinamis (prioritas: rute /dashboard/workspaces/[id] > activeWorkspaceId > default)
  const routeWsId = React.useMemo(() => {
    if (!pathname) return null;
    const wsMatch = pathname.match(/\/dashboard\/workspaces\/([^/]+)/);
    return wsMatch ? wsMatch[1] : null;
  }, [pathname]);

  const effectiveActiveWsId = routeWsId || activeWorkspaceId || workspaces[0]?.id || "";

  const activeWorkspace: Workspace = React.useMemo(() => {
    return (
      workspaces.find((ws) => ws.id === effectiveActiveWsId) ??
      workspaces[0] ?? { id: "default", name: "Workspace" }
    );
  }, [workspaces, effectiveActiveWsId]);

  const currentWorkspaceProjects = React.useMemo(() => {
    return projects.filter((p) => p.workspace_id === activeWorkspace.id);
  }, [projects, activeWorkspace.id]);

  const currentWorkspaceTodos = React.useMemo(() => {
    const currentProjIds = new Set(currentWorkspaceProjects.map((p) => p.id));
    return todos.filter((t) => !t.is_event && currentProjIds.has(t.project_id));
  }, [todos, currentWorkspaceProjects]);

  const workspaceTaskCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    workspaces.forEach((ws) => {
      const wsProjectIds = new Set(
        projects.filter((p) => p.workspace_id === ws.id).map((p) => p.id)
      );
      counts[ws.id] = todos.filter((t) => !t.is_event && wsProjectIds.has(t.project_id)).length;
    });
    return counts;
  }, [workspaces, projects, todos]);

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    router.push(`/dashboard/workspaces/${id}`);
  };

  const handleCreateWorkspace = async (name: string) => {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name,
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    await insertWorkspace(newWs);
    toast.success(`Workspace "${name}" tersimpan di Supabase`);
    router.push(`/dashboard/workspaces/${newWs.id}`);
  };

  const handleDeleteWorkspace = async (id: string) => {
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
    if (activeWorkspaceId === id) {
      const remaining = workspaces.filter((ws) => ws.id !== id);
      if (remaining.length > 0) {
        setActiveWorkspaceId(remaining[0].id);
        router.push(`/dashboard/workspaces/${remaining[0].id}`);
      } else {
        router.push("/dashboard");
      }
    }
    await removeWorkspace(id);
    toast.info("Workspace telah dihapus dari Supabase");
  };

  const handleCreateProject = async (name: string, color: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      workspace_id: activeWorkspace.id,
      name,
      color,
      task_count: 0,
    };
    setProjects((prev) => [...prev, newProject]);
    await insertProject(newProject);
    toast.success(`Project "${name}" tersimpan di Supabase`);
  };

  const handleSyncTodos = async (updatedTodos: Todo[]) => {
    const previousTodos = todos;
    setTodos(updatedTodos);
    try {
      localStorage.setItem("taskflow_cache_todos", JSON.stringify(updatedTodos));
    } catch {
      // ignore
    }

    try {
      const currentIds = new Set(updatedTodos.map((t) => t.id));
      const removedTodos = previousTodos.filter((t) => !currentIds.has(t.id));
      for (const removed of removedTodos) {
        await removeTodo(removed.id);
      }

      for (const updated of updatedTodos) {
        const existing = previousTodos.find((t) => t.id === updated.id);
        if (!existing) {
          await saveTodo(updated);
        } else if (
          existing.status !== updated.status ||
          existing.title !== updated.title ||
          existing.description !== updated.description ||
          existing.priority !== updated.priority ||
          existing.due_date !== updated.due_date ||
          JSON.stringify(existing.subtasks) !== JSON.stringify(updated.subtasks)
        ) {
          if (existing.status !== updated.status && existing.title === updated.title) {
            await updateTodoStatus(updated.id, updated.status);
          } else {
            await saveTodo(updated);
          }
        }
      }
    } catch (error) {
      console.error("Error syncing with Supabase:", error);
    }
  };

  const handleQuickSaveTodo = (todoData: {
    title: string;
    description: string;
    project_id: string;
    priority: Priority;
    status: Status;
    due_date?: string | null;
    subtasks: Subtask[];
  }) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (todoData.due_date && todoData.due_date < todayStr) {
      toast.error("Batas waktu tidak boleh sebelum hari ini.");
      return;
    }

    const targetProject = projects.find((p) => p.id === todoData.project_id) ?? projects[0];
    const targetProjectId = targetProject?.id ?? "proj-1";

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title: todoData.title,
      description: todoData.description,
      project_id: targetProjectId,
      priority: todoData.priority,
      status: todoData.status,
      due_date: todoData.due_date,
      subtasks: todoData.subtasks,
      created_at: new Date().toISOString(),
    };

    handleSyncTodos([newTodo, ...todos]);
    const targetWs = workspaces.find((w) => w.id === targetProject?.workspace_id);
    const wsNotice = targetWs ? ` di workspace "${targetWs.name}"` : "";
    toast.success(`Task "${newTodo.title}" berhasil ditambahkan${wsNotice}!`);
    setIsQuickCreateOpen(false);
  };

  return (
    <DashboardContext.Provider
      value={{
        workspaces,
        activeWorkspaceId: effectiveActiveWsId,
        projects,
        todos,
        currentUserProfile,
        activeWorkspace,
        currentWorkspaceProjects,
        currentWorkspaceTodos,
        workspaceTaskCounts,
        isQuickCreateOpen,
        isLoadingData,
        aiMessages,
        setAiMessages,
        setActiveWorkspaceId,
        handleSelectWorkspace,
        handleCreateWorkspace,
        handleDeleteWorkspace,
        handleCreateProject,
        handleSyncTodos,
        handleQuickSaveTodo,
        setIsQuickCreateOpen,
        setCurrentUserProfile,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

const defaultFallbackContext: DashboardContextType = {
  workspaces: [],
  activeWorkspaceId: "",
  projects: [],
  todos: [],
  currentUserProfile: null,
  activeWorkspace: { id: "default", name: "Workspace" },
  currentWorkspaceProjects: [],
  currentWorkspaceTodos: [],
  workspaceTaskCounts: {},
  isQuickCreateOpen: false,
  isLoadingData: false,
  aiMessages: [],
  setAiMessages: () => {},
  setActiveWorkspaceId: () => {},
  handleSelectWorkspace: () => {},
  handleCreateWorkspace: async () => {},
  handleDeleteWorkspace: async () => {},
  handleCreateProject: async () => {},
  handleSyncTodos: async () => {},
  handleQuickSaveTodo: () => {},
  setIsQuickCreateOpen: () => {},
  setCurrentUserProfile: () => {},
};

export function useDashboard(): DashboardContextType {
  const context = React.useContext(DashboardContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
}

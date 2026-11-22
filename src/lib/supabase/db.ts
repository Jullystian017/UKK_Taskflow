import { createClient } from "./client";
import { Workspace, Project, Todo, Status, Priority, Subtask } from "@/types";

const supabase = createClient();

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching workspaces:", error);
    return [];
  }
  return data || [];
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return data || [];
}

export async function getTodos(): Promise<Todo[]> {
  const [{ data: todosData, error: todosError }, { data: subtasksData }] =
    await Promise.all([
      supabase.from("todos").select("*").order("created_at", { ascending: false }),
      supabase.from("subtasks").select("*").order("created_at", { ascending: true }),
    ]);

  if (todosError) {
    console.error("Error fetching todos:", todosError);
    return [];
  }

  const subtasksMap = new Map<string, Subtask[]>();
  (subtasksData || []).forEach((sub) => {
    const list = subtasksMap.get(sub.todo_id) || [];
    list.push(sub);
    subtasksMap.set(sub.todo_id, list);
  });

  return (todosData || []).map((t) => ({
    id: t.id,
    project_id: t.project_id,
    title: t.title,
    description: t.description,
    status: t.status as Status,
    priority: t.priority as Priority,
    due_date: t.due_date,
    created_at: t.created_at,
    is_event: Boolean(t.is_event),
    subtasks: subtasksMap.get(t.id) || [],
  }));
}

export async function insertWorkspace(workspace: { id: string; name: string }) {
  const userId = await getCurrentUserId();
  const payload = {
    id: workspace.id,
    name: workspace.name,
    ...(userId ? { user_id: userId } : {}),
  };
  const { data, error } = await supabase
    .from("workspaces")
    .insert([payload])
    .select();
  if (error) console.error("Error creating workspace:", error.message || error);
  return { data, error };
}

export async function removeWorkspace(id: string) {
  const { error } = await supabase.from("workspaces").delete().eq("id", id);
  if (error) console.error("Error deleting workspace:", error.message || error);
  return { error };
}

export async function insertProject(project: {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  task_count?: number;
}) {
  const userId = await getCurrentUserId();
  const payload = {
    id: project.id,
    workspace_id: project.workspace_id,
    name: project.name,
    color: project.color,
    ...(userId ? { user_id: userId } : {}),
  };
  const { data, error } = await supabase.from("projects").insert([payload]).select();
  if (error) console.error("Error creating project:", error.message || error);
  return { data, error };
}

export async function updateProject(id: string, updates: { name: string; color: string }) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) console.error("Error updating project:", error.message || error);
  return { data, error };
}

export async function removeProject(id: string) {
  // Hapus semua todo terkait project ini
  await supabase.from("todos").delete().eq("project_id", id);
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) console.error("Error deleting project:", error.message || error);
  return { error };
}

export async function saveTodo(todo: Todo) {
  const userId = await getCurrentUserId();
  // 1. Upsert todo
  const { error: todoError } = await supabase.from("todos").upsert({
    id: todo.id,
    project_id: todo.project_id,
    user_id: userId ?? undefined,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    priority: todo.priority,
    due_date: todo.due_date,
    is_event: Boolean(todo.is_event),
  });

  if (todoError) {
    console.error("Error saving todo:", todoError);
  }

  // 2. Save subtasks if present
  if (todo.subtasks && todo.subtasks.length > 0) {
    const subtaskPayloads = todo.subtasks.map((s) => ({
      id: s.id,
      todo_id: todo.id,
      user_id: userId ?? undefined,
      title: s.title,
      is_done: s.is_done,
    }));
    await supabase.from("subtasks").upsert(subtaskPayloads);
  }

  return { error: todoError };
}

export async function updateTodoStatus(id: string, status: Status) {
  const { error } = await supabase.from("todos").update({ status }).eq("id", id);
  if (error) console.error("Error updating todo status:", error);
  return { error };
}

export async function removeTodo(id: string) {
  // Delete associated subtasks first
  await supabase.from("subtasks").delete().eq("todo_id", id);
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) console.error("Error deleting todo:", error);
  return { error };
}

/**
 * Menyiapkan workspace awal personal jika pengguna belum memiliki workspace apapun di akunnya.
 */
export async function ensureUserStarterData(): Promise<{
  workspaces: Workspace[];
  projects: Project[];
  todos: Todo[];
}> {
  const userId = await getCurrentUserId();
  const existingWorkspaces = await getWorkspaces();
  let projects = await getProjects();
  const todos = await getTodos();

  if (existingWorkspaces && existingWorkspaces.length > 0) {
    // Jika workspace sudah ada tapi project kosong (misal akibat error sebelumnya)
    if (projects.length === 0) {
      const defaultProj: Project = {
        id: `proj-${Date.now()}`,
        workspace_id: existingWorkspaces[0].id,
        name: "Tugas Utama",
        color: "#6366f1",
        user_id: userId ?? undefined,
        task_count: todos.length,
      };
      await insertProject(defaultProj);
      projects = [defaultProj];
    }
    return { workspaces: existingWorkspaces, projects, todos };
  }

  // Jika belum ada workspace untuk user ini, buatkan starter workspace
  const starterWsId = `ws-${Date.now()}`;
  const starterProjId = `proj-${Date.now()}`;
  const starterTodoId = `todo-${Date.now()}`;

  const defaultWs: Workspace = {
    id: starterWsId,
    name: "My Tasks",
    user_id: userId ?? undefined,
  };

  const defaultProj: Project = {
    id: starterProjId,
    workspace_id: starterWsId,
    name: "Tugas Utama",
    color: "#6366f1",
    user_id: userId ?? undefined,
    task_count: 1,
  };

  const defaultTodo: Todo = {
    id: starterTodoId,
    project_id: starterProjId,
    user_id: userId ?? undefined,
    title: "Mulai atur alur kerja dengan TaskFlow",
    description: "Selamat datang! Buat catatan, kelola kanban board, dan gunakan AI Assistant untuk memaksimalkan produktivitasmu.",
    status: "in_progress",
    priority: "medium",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    subtasks: [
      { id: `sub-${Date.now()}-1`, todo_id: starterTodoId, title: "Jelajahi Kanban Board", is_done: true },
      { id: `sub-${Date.now()}-2`, todo_id: starterTodoId, title: "Coba fitur Drag and Drop", is_done: false },
    ],
  };

  await insertWorkspace(defaultWs);
  await insertProject(defaultProj);
  await saveTodo(defaultTodo);

  return {
    workspaces: [defaultWs],
    projects: [defaultProj],
    todos: [defaultTodo],
  };
}

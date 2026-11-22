export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in_progress" | "done";

export interface Workspace {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  task_count?: number;
  user_id?: string;
  created_at?: string;
}

export interface Subtask {
  id: string;
  todo_id: string;
  user_id?: string;
  title: string;
  is_done: boolean;
  created_at?: string;
}

export interface Todo {
  id: string;
  project_id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  status: Status;
  priority: Priority;
  due_date?: string | null;
  subtasks?: Subtask[];
  created_at?: string;
  is_event?: boolean;
}

export interface Profile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string;
}

export type ActiveView = "overview" | "workspace" | "calendar" | "ai-chat" | "profile";

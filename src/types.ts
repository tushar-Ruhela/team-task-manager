// ─────────────────────────────────────────────
// Shared TypeScript types across API and Web
// ─────────────────────────────────────────────

export type UserRole = "ADMIN" | "MEMBER";
export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface ProjectMemberUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: ProjectRole;
  joinedAt: string;
}

export interface TaskUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: TaskUser | null;
  createdBy?: TaskUser;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  color: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    tasks: number;
  };
  owner?: TaskUser;
  myRole?: ProjectRole;
}

export interface DashboardStats {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueTasks: number;
  totalProjects: number;
  activeProjects: number;
  recentTasks: Task[];
}

// API Response wrappers
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

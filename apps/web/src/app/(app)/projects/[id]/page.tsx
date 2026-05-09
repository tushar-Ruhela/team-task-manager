"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { format, isPast } from "date-fns";
import toast from "react-hot-toast";
import type { Task, Project } from "@ttm/types";

const COLUMNS = [
  { key: "TODO", label: "To Do", color: "var(--todo-color)", dot: "#64748b" },
  { key: "IN_PROGRESS", label: "In Progress", color: "var(--inprogress-color)", dot: "#6366f1" },
  { key: "REVIEW", label: "Review", color: "var(--review-color)", dot: "#f59e0b" },
  { key: "DONE", label: "Done", color: "var(--done-color)", dot: "#22c55e" },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "var(--low-color)", MEDIUM: "var(--medium-color)",
  HIGH: "var(--high-color)", URGENT: "var(--urgent-color)",
};

interface TaskWithDetails extends Task {
  assignee?: { id: string; name: string; email: string; avatar?: string | null } | null;
  createdBy?: { id: string; name: string; email: string };
}

interface ProjectWithDetails extends Omit<Project, "myRole"> {
  myRole?: string;
  members: Array<{ userId: string; role: string; user: { id: string; name: string; email: string; avatar?: string | null } }>;
  tasks: TaskWithDetails[];
}

type ModalMode = "create" | "edit" | null;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  // Task form state
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "", assigneeId: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.get(`/projects/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      setProject(res.data.data);
    } catch { toast.error("Failed to load project"); }
    setLoading(false);
  }, [accessToken, id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const tasksByStatus = (status: string) =>
    (project?.tasks || []).filter((t) => t.status === status);

  const canManage = project?.myRole === "ADMIN" || user?.role === "ADMIN";

  const openCreate = () => {
    setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", assigneeId: "" });
    setEditingTask(null);
    setModalMode("create");
  };

  const openEdit = (task: TaskWithDetails) => {
    setForm({
      title: task.title, description: task.description || "",
      priority: task.priority, assigneeId: task.assigneeId || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 16) : "",
    });
    setEditingTask(task);
    setModalMode("edit");
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSubmitting(true);
    try {
      const body = {
        title: form.title, description: form.description || undefined,
        priority: form.priority, assigneeId: form.assigneeId || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };
      if (modalMode === "create") {
        await api.post(`/tasks/projects/${id}/tasks`, body, { headers: { Authorization: `Bearer ${accessToken}` } });
        toast.success("Task created!");
      } else if (editingTask) {
        await api.put(`/tasks/projects/${id}/tasks/${editingTask.id}`, body, { headers: { Authorization: `Bearer ${accessToken}` } });
        toast.success("Task updated!");
      }
      setModalMode(null);
      fetchProject();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed");
    } finally { setSubmitting(false); }
  };

  const updateStatus = async (taskId: string, status: string) => {
    try {
      await api.patch(`/tasks/projects/${id}/tasks/${taskId}/status`, { status }, { headers: { Authorization: `Bearer ${accessToken}` } });
      setProject((prev) => prev ? {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === taskId ? { ...t, status: status as Task["status"] } : t),
      } : prev);
    } catch { toast.error("Failed to update status"); }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/projects/${id}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast.success("Task deleted");
      fetchProject();
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!project) return <div className="empty-state"><div className="empty-icon">❌</div><div className="empty-title">Project not found</div></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/projects" style={{ color: "var(--text-muted)", fontSize: 20 }}>←</Link>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: project.color + "22", border: `2px solid ${project.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: project.color,
          }}>{project.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <h1 className="page-title" style={{ fontSize: 22 }}>{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/projects/${id}/members`} className="btn btn-secondary btn-sm">
            👥 Members ({project._count?.members ?? project.members.length})
          </Link>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            ➕ Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.key);
          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <div className="column-dot" style={{ background: col.dot }} />
                  <span style={{ color: col.color }}>{col.label}</span>
                </div>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {colTasks.map((task) => {
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
                  return (
                    <div key={task.id} className="task-card" onClick={() => openEdit(task)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[task.priority], textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {task.priority}
                        </span>
                        {canManage && (
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}
                            title="Delete task">×</button>
                        )}
                      </div>
                      <div className="task-card-title">{task.title}</div>
                      <div className="task-card-meta">
                        <div className="task-card-footer">
                          {task.assignee && (
                            <div className="avatar avatar-sm" title={task.assignee.name} style={{ fontSize: 10 }}>
                              {task.assignee.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {task.dueDate && (
                            <span className={`due-date ${isOverdue ? "due-overdue" : ""}`}>
                              📅 {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                        {/* Status change dropdown */}
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); updateStatus(task.id, e.target.value); }}
                          style={{ fontSize: 11, background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 4px", cursor: "pointer" }}
                        >
                          {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
                <button onClick={openCreate} className="btn btn-ghost btn-sm w-full" style={{ marginTop: 4, justifyContent: "center", border: "1px dashed var(--border)", borderRadius: 8 }}>
                  + Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {modalMode && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modalMode === "create" ? "New Task" : "Edit Task"}</h2>
              <button className="modal-close" onClick={() => setModalMode(null)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" style={{ minHeight: 80 }} placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due date</label>
                  <input type="datetime-local" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-input form-select" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : modalMode === "create" ? "Create Task" : "Save Changes"}
              </button>
              <button className="btn btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

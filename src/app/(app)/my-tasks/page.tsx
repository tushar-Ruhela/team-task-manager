"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { format, isPast } from "date-fns";
import Link from "next/link";
import type { Task } from "@/types";

type MyTask = Task & {
  project: { id: string; name: string; color: string };
  assignee?: { id: string; name: string } | null;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  TODO: { label: "To Do", color: "var(--todo-color)", bg: "rgba(100,116,139,0.15)" },
  IN_PROGRESS: { label: "In Progress", color: "var(--inprogress-color)", bg: "rgba(99,102,241,0.15)" },
  REVIEW: { label: "Review", color: "var(--review-color)", bg: "rgba(245,158,11,0.15)" },
  DONE: { label: "Done", color: "var(--done-color)", bg: "rgba(34,197,94,0.15)" },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "var(--low-color)", MEDIUM: "var(--medium-color)",
  HIGH: "var(--high-color)", URGENT: "var(--urgent-color)",
};

const STATUS_KEYS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export default function MyTasksPage() {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!accessToken) return;
    api.get("/tasks/my-tasks", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => setTasks(r.data.data))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const updateStatus = async (taskId: string, projectId: string, status: string) => {
    try {
      await api.patch(`/tasks/projects/${projectId}/tasks/${taskId}/status`, { status }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: status as Task["status"] } : t));
    } catch {}
  };

  const filtered = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);
  const overdue = tasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "DONE");

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks ✅</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you{overdue.length > 0 ? ` · ${overdue.length} overdue` : ""}</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 10, fontSize: 14,
        }}>
          <span>⚠️</span>
          <span style={{ color: "var(--danger)", fontWeight: 500 }}>
            You have {overdue.length} overdue task{overdue.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {["ALL", ...STATUS_KEYS].map((s) => {
          const count = s === "ALL" ? tasks.length : tasks.filter((t) => t.status === s).length;
          const meta = s !== "ALL" ? STATUS_META[s] : null;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`}
              style={filter === s && meta ? { background: meta.color, borderColor: meta.color } : {}}>
              {s === "ALL" ? "All" : meta?.label} <span style={{ opacity: 0.7, fontSize: 11 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">{filter === "ALL" ? "No tasks assigned to you" : "No tasks in this status"}</div>
          <div className="empty-desc">Ask your project admin to assign you some tasks.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((task) => {
            const meta = STATUS_META[task.status];
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
            return (
              <div key={task.id} className="card card-sm" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: task.project.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 15 }} className="truncate">{task.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Link href={`/projects/${task.project.id}`} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {task.project.name}
                    </Link>
                    <span style={{ color: "var(--text-muted)", fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                    {task.dueDate && (
                      <>
                        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>·</span>
                        <span className={`due-date ${isOverdue ? "due-overdue" : ""}`}>
                          📅 {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <select value={task.status}
                  onChange={(e) => updateStatus(task.id, task.project.id, e.target.value)}
                  style={{ fontSize: 12, background: meta.bg, color: meta.color,
                    border: `1px solid ${meta.color}40`, borderRadius: 8, padding: "5px 10px",
                    cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>
                  {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

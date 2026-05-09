"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { format, isPast } from "date-fns";
import type { Task } from "@ttm/types";

interface Stats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  tasksByStatus: { TODO: number; IN_PROGRESS: number; REVIEW: number; DONE: number };
  overdueTasks: number;
  myAssigned: number;
  myOverdue: number;
  recentTasks: (Task & { project: { id: string; name: string; color: string } })[];
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  TODO: { label: "To Do", color: "var(--todo-color)", bg: "rgba(100,116,139,0.15)" },
  IN_PROGRESS: { label: "In Progress", color: "var(--inprogress-color)", bg: "rgba(99,102,241,0.15)" },
  REVIEW: { label: "Review", color: "var(--review-color)", bg: "rgba(245,158,11,0.15)" },
  DONE: { label: "Done", color: "var(--done-color)", bg: "rgba(34,197,94,0.15)" },
};

const PRIORITY_META: Record<string, { color: string }> = {
  LOW: { color: "var(--low-color)" }, MEDIUM: { color: "var(--medium-color)" },
  HIGH: { color: "var(--high-color)" }, URGENT: { color: "var(--urgent-color)" },
};

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setStats(res.data.data);
      } catch {}
      setLoading(false);
    };
    if (accessToken) fetchStats();
  }, [accessToken]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const statCards = [
    { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: "🗂️", bg: "rgba(99,102,241,0.1)", color: "var(--accent)" },
    { label: "Active Projects", value: stats?.activeProjects ?? 0, icon: "🚀", bg: "rgba(34,197,94,0.1)", color: "var(--success)" },
    { label: "Total Tasks", value: stats?.totalTasks ?? 0, icon: "📋", bg: "rgba(245,158,11,0.1)", color: "var(--warning)" },
    { label: "Overdue Tasks", value: stats?.overdueTasks ?? 0, icon: "⚠️", bg: "rgba(239,68,68,0.1)", color: "var(--danger)" },
    { label: "My Assigned", value: stats?.myAssigned ?? 0, icon: "👤", bg: "rgba(139,92,246,0.1)", color: "#8b5cf6" },
    { label: "My Overdue", value: stats?.myOverdue ?? 0, icon: "🔥", bg: "rgba(239,68,68,0.08)", color: "var(--danger)" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard 📊</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(" ")[0]}! Here's your overview.</p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          <span>➕</span> New Project
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Status Breakdown */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Task Status Breakdown</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(stats.tasksByStatus).map(([status, count]) => {
                const meta = STATUS_META[status];
                const pct = stats.totalTasks > 0 ? Math.round((count / stats.totalTasks) * 100) : 0;
                return (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: "var(--text-secondary)" }}>{meta.label}</span>
                      <span style={{ fontWeight: 600, color: meta.color }}>{count} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ background: "var(--bg-elevated)", borderRadius: 100, height: 8 }}>
                      <div style={{ background: meta.color, borderRadius: 100, height: 8, width: `${pct}%`, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "/projects/new", icon: "🗂️", label: "Create new project", desc: "Start a new project with your team" },
                { href: "/my-tasks", icon: "✅", label: "View my tasks", desc: `${stats.myAssigned} tasks assigned to you` },
                { href: "/projects", icon: "👥", label: "Browse projects", desc: `${stats.totalProjects} total projects` },
              ].map((action) => (
                <Link key={action.href} href={action.href} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: 12,
                  background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)",
                  transition: "all 0.2s", textDecoration: "none",
                }}>
                  <span style={{ fontSize: 22 }}>{action.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{action.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {stats && stats.recentTasks.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Recent Tasks</h2>
            <Link href="/my-tasks" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {stats.recentTasks.slice(0, 8).map((task) => {
              const meta = STATUS_META[task.status];
              const overdue = task.dueDate && !isPast(new Date(task.dueDate)) === false && task.status !== "DONE";
              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0", borderBottom: "1px solid var(--border)", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: task.project?.color || "var(--accent)", flexShrink: 0,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }} className="truncate">{task.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{task.project?.name}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {task.dueDate && (
                      <span className={`due-date ${overdue ? "due-overdue" : ""}`}>
                        📅 {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    )}
                    <span className="badge" style={{ background: meta.bg, color: meta.color, fontSize: 10 }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 11, color: PRIORITY_META[task.priority]?.color, fontWeight: 600 }}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

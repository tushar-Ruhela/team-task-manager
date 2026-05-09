"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import type { Project } from "@ttm/types";

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "var(--success)" },
  ARCHIVED: { label: "Archived", color: "var(--text-muted)" },
  COMPLETED: { label: "Completed", color: "var(--accent)" },
};

export default function ProjectsPage() {
  const { accessToken, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    api.get("/projects", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => setProjects(r.data.data))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects 🗂️</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""} you're a part of</p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          <span>➕</span> New Project
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          className="form-input"
          placeholder="🔍  Search projects..."
          style={{ maxWidth: 360 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗂️</div>
          <div className="empty-title">{search ? "No matching projects" : "No projects yet"}</div>
          <div className="empty-desc">{search ? "Try a different search term" : "Create your first project to get started"}</div>
          {!search && <Link href="/projects/new" className="btn btn-primary" style={{ marginTop: 8 }}>Create project</Link>}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project) => {
            const statusMeta = STATUS_META[project.status] || STATUS_META.ACTIVE;
            const initials = project.name.slice(0, 2).toUpperCase();
            return (
              <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
                <div className="project-card" style={{ "--project-color": project.color } as React.CSSProperties}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: project.color, borderRadius: "16px 16px 0 0" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: project.color + "22", border: `2px solid ${project.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: project.color,
                    }}>
                      {initials}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100,
                      background: statusMeta.color + "15", color: statusMeta.color,
                    }}>{statusMeta.label}</span>
                  </div>
                  <div className="project-card-name">{project.name}</div>
                  {project.description && <div className="project-card-desc">{project.description}</div>}
                  <div className="project-card-meta">
                    <div className="project-meta-item">
                      <span>👥</span> {(project._count?.members ?? 0)} member{project._count?.members !== 1 ? "s" : ""}
                    </div>
                    <div className="project-meta-item">
                      <span>📋</span> {(project._count?.tasks ?? 0)} task{project._count?.tasks !== 1 ? "s" : ""}
                    </div>
                    {(project as Project & { myRole?: string }).myRole && (
                      <div className="project-meta-item" style={{ marginLeft: "auto" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          background: (project as Project & { myRole?: string }).myRole === "ADMIN" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.1)",
                          color: (project as Project & { myRole?: string }).myRole === "ADMIN" ? "var(--accent)" : "var(--success)",
                        }}>
                          {(project as Project & { myRole?: string }).myRole}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

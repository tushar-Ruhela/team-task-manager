"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    { icon: "🗂️", title: "Project Management", desc: "Create and organize projects with custom colors, statuses, and team members.", bg: "rgba(99,102,241,0.1)" },
    { icon: "✅", title: "Task Tracking", desc: "Create tasks with priority, due dates, and assignments. Track with a Kanban board.", bg: "rgba(34,197,94,0.1)" },
    { icon: "👥", title: "Team Collaboration", desc: "Invite members, assign roles (Admin/Member), and collaborate in real-time.", bg: "rgba(245,158,11,0.1)" },
    { icon: "📊", title: "Dashboard Analytics", desc: "Get a bird's eye view of all tasks, statuses, overdue items, and project progress.", bg: "rgba(139,92,246,0.1)" },
    { icon: "🔒", title: "Role-Based Access", desc: "Granular permissions at system and project level. Admins control everything.", bg: "rgba(239,68,68,0.1)" },
    { icon: "⚡", title: "Real-time Updates", desc: "Task status changes, assignments, and project events happen instantly.", bg: "rgba(59,130,246,0.1)" },
  ];

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: 18 }}>
          <div className="logo-icon">⚡</div>
          TaskFlow
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Go to Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Get Started Free</Link>
            </>
          )}
        </div>
      </nav>

      <div className="landing-hero">
        <div className="hero-badge">
          <span>🎉</span>
          <span>Built for modern teams</span>
        </div>
        <h1 className="hero-title">
          Manage tasks.<br />
          <span className="gradient">Ship faster.</span>
        </h1>
        <p className="hero-desc">
          TaskFlow is a full-stack team task manager with role-based access, Kanban boards, 
          and a powerful dashboard — everything your team needs to stay aligned and deliver on time.
        </p>
        <div className="hero-actions">
          <Link href="/signup" className="btn btn-primary btn-lg">Start for free →</Link>
          <Link href="/login" className="btn btn-secondary btn-lg">Sign in</Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "24px 60px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 64, flexWrap: "wrap" }}>
          {[["Projects", "Unlimited"], ["Team Members", "Any size"], ["Task Statuses", "4 stages"], ["Access Roles", "Admin + Member"]].map(([label, value]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>{value}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-grid">
        {features.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "40px 24px 80px", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Ready to get started?</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>Create your account and build your first project in minutes.</p>
        <Link href="/signup" className="btn btn-primary btn-lg">Create free account →</Link>
      </div>
    </div>
  );
}

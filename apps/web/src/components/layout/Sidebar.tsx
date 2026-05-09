"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/projects", icon: "🗂️", label: "Projects" },
  { href: "/my-tasks", icon: "✅", label: "My Tasks" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">⚡</div>
          <span>TaskFlow</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-title">Navigation</span>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {user?.role === "ADMIN" && (
          <>
            <span className="nav-section-title">Admin</span>
            <Link href="/projects/new" className={`nav-item ${pathname === "/projects/new" ? "active" : ""}`}>
              <span style={{ fontSize: 16 }}>➕</span>
              New Project
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 0" }}>
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{user?.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="truncate">{user?.email}</div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
            background: user?.role === "ADMIN" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.1)",
            color: user?.role === "ADMIN" ? "var(--accent)" : "var(--success)",
          }}>{user?.role}</span>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start" }}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Member {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: { id: string; name: string; email: string; avatar?: string | null };
}

interface Project {
  id: string;
  name: string;
  color: string;
  myRole?: string;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
}

export default function MembersPage() {
  const params = useParams();
  const id = params?.id as string;
  const { accessToken, user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addRole, setAddRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [addingId, setAddingId] = useState<string | null>(null);

  const canManage = project?.myRole === "ADMIN" || user?.role === "ADMIN";

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [projRes, membersRes] = await Promise.all([
      api.get(`/projects/${id}`, { headers }),
      api.get(`/projects/${id}/members`, { headers }),
    ]);
    setProject(projRes.data.data);
    setMembers(membersRes.data.data);
    setLoading(false);
  }, [accessToken, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ✅ FIX: Search fires when panel opens (empty = show all available users)
  // AND whenever search text changes. Debounced 300ms.
  const doSearch = useCallback(async (query: string) => {
    if (!showAdd || !accessToken) return;
    setSearchLoading(true);
    try {
      const res = await api.get(
        `/projects/${id}/users/search?search=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSearchResults(res.data.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [showAdd, accessToken, id]);

  // Trigger search when panel opens OR search text changes
  useEffect(() => {
    if (!showAdd) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, showAdd, doSearch]);

  const handleToggleAdd = () => {
    const next = !showAdd;
    setShowAdd(next);
    if (!next) {
      setSearch("");
      setSearchResults([]);
    }
  };

  const addMember = async (userId: string) => {
    setAddingId(userId);
    try {
      await api.post(`/projects/${id}/members`, { userId, role: addRole }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Member added!");
      // Remove added user from results immediately
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to add member"
      );
    } finally {
      setAddingId(null);
    }
  };

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Member removed");
      fetchData();
    } catch { toast.error("Failed to remove member"); }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      await api.put(`/projects/${id}/members/${userId}/role`, { role }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Role updated");
      fetchData();
    } catch { toast.error("Failed to update role"); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href={`/projects/${id}`} style={{ color: "var(--text-muted)", fontSize: 20 }}>←</Link>
          <div>
            <h1 className="page-title">Team Members</h1>
            <p className="page-subtitle">
              {project?.name} · {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {canManage && (
          <button className={`btn btn-sm ${showAdd ? "btn-secondary" : "btn-primary"}`} onClick={handleToggleAdd}>
            {showAdd ? "✕ Cancel" : "➕ Add Member"}
          </button>
        )}
      </div>

      {/* ── Role Info Banner ─────────────────────────────────── */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "12px 16px", marginBottom: 20,
        display: "flex", gap: 24, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "rgba(99,102,241,0.15)", color: "var(--accent)" }}>ADMIN</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Can manage members, update & delete project, delete tasks</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "rgba(34,197,94,0.1)", color: "var(--success)" }}>MEMBER</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Can create tasks, update their own tasks</span>
        </div>
      </div>

      {/* ── Add Member Panel ─────────────────────────────────── */}
      {showAdd && canManage && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Add Team Member</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Search for registered users to add to this project.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                className="form-input"
                placeholder="🔍  Search by name or email..."
                value={search}
                autoFocus
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingRight: searchLoading ? 40 : 14 }}
              />
              {searchLoading && (
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                </div>
              )}
            </div>
            <select
              className="form-input form-select"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as "ADMIN" | "MEMBER")}
              style={{ width: 150 }}
            >
              <option value="MEMBER">As Member</option>
              <option value="ADMIN">As Admin</option>
            </select>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              {searchResults.map((u) => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderBottom: "1px solid var(--border)",
                  transition: "background 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="avatar avatar-sm" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => addMember(u.id)}
                    disabled={addingId === u.id}
                  >
                    {addingId === u.id
                      ? <span className="spinner" style={{ width: 14, height: 14 }} />
                      : `+ Add as ${addRole === "ADMIN" ? "Admin" : "Member"}`}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!searchLoading && searchResults.length === 0 && (
            <div style={{
              textAlign: "center", padding: 24,
              border: "1px dashed var(--border)", borderRadius: 10,
              color: "var(--text-muted)", fontSize: 14,
            }}>
              {search
                ? `No users found matching "${search}". They may already be members.`
                : "No other registered users to add yet. Ask them to sign up first."}
            </div>
          )}
        </div>
      )}

      {/* ── Members Table ─────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Members ({members.length})</span>
          {!canManage && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Only project admins can manage members</span>
          )}
        </div>
        <table className="members-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Joined</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="avatar avatar-sm">{m.user.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {m.user.name}
                        {m.userId === user?.id && (
                          <span style={{ fontSize: 10, marginLeft: 6, color: "var(--text-muted)" }}>(you)</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {canManage && m.userId !== user?.id ? (
                    <select value={m.role} onChange={(e) => updateRole(m.userId, e.target.value)}
                      style={{
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: m.role === "ADMIN" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.1)",
                        color: m.role === "ADMIN" ? "var(--accent)" : "var(--success)",
                        border: `1px solid ${m.role === "ADMIN" ? "rgba(99,102,241,0.3)" : "rgba(34,197,94,0.3)"}`,
                        borderRadius: 6, padding: "4px 8px",
                      }}>
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                      background: m.role === "ADMIN" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.1)",
                      color: m.role === "ADMIN" ? "var(--accent)" : "var(--success)",
                    }}>{m.role}</span>
                  )}
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {format(new Date(m.joinedAt), "MMM d, yyyy")}
                </td>
                {canManage && (
                  <td>
                    {m.userId !== user?.id ? (
                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.userId, m.user.name)}>
                        Remove
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

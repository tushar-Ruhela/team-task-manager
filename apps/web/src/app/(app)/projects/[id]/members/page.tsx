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
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [addRole, setAddRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

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

  useEffect(() => {
    if (!search.trim() || !showAdd) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/projects/${id}/users/search?search=${search}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSearchResults(res.data.data);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [search, showAdd, id, accessToken]);

  const addMember = async (userId: string) => {
    try {
      await api.post(`/projects/${id}/members`, { userId, role: addRole }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Member added!");
      setShowAdd(false);
      setSearch("");
      fetchData();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed");
    }
  };

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast.success("Member removed");
      fetchData();
    } catch { toast.error("Failed to remove member"); }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      await api.put(`/projects/${id}/members/${userId}/role`, { role }, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast.success("Role updated");
      fetchData();
    } catch { toast.error("Failed to update role"); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href={`/projects/${id}`} style={{ color: "var(--text-muted)", fontSize: 20 }}>←</Link>
          <div>
            <h1 className="page-title">Team Members</h1>
            <p className="page-subtitle">{project?.name} · {members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
            ➕ Add Member
          </button>
        )}
      </div>

      {/* Add member panel */}
      {showAdd && canManage && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Add Team Member</h3>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input className="form-input" placeholder="Search by name or email..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
            <select className="form-input form-select" value={addRole} onChange={(e) => setAddRole(e.target.value as "ADMIN" | "MEMBER")} style={{ width: 140 }}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {searchResults.length > 0 && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              {searchResults.map((u) => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="avatar avatar-sm">{u.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => addMember(u.id)}>Add</button>
                </div>
              ))}
            </div>
          )}
          {search && searchResults.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: 16 }}>No users found (they may already be members)</p>
          )}
        </div>
      )}

      {/* Members Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
                      <div style={{ fontWeight: 500 }}>{m.user.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {canManage && m.userId !== user?.id ? (
                    <select value={m.role} onChange={(e) => updateRole(m.userId, e.target.value)}
                      style={{ fontSize: 12, background: "var(--bg-elevated)", color: m.role === "ADMIN" ? "var(--accent)" : "var(--success)",
                        border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontWeight: 600 }}>
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
                    {m.userId !== user?.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.userId, m.user.name)}>
                        Remove
                      </button>
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

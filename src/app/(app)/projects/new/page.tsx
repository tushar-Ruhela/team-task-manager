"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "At least 2 characters").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  status: z.enum(["ACTIVE", "ARCHIVED", "COMPLETED"]),
});
type FormData = z.infer<typeof schema>;

const PRESET_COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#22c55e","#3b82f6","#06b6d4","#14b8a6","#f97316"];

export default function NewProjectPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: "#6366f1", status: "ACTIVE" },
  });

  const selectedColor = watch("color");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post("/projects", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Project created!");
      router.push(`/projects/${res.data.data.id}`);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Project</h1>
          <p className="page-subtitle">Set up a new project for your team</p>
        </div>
        <Link href="/projects" className="btn btn-secondary btn-sm">← Back</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Project name *</label>
            <input className={`form-input ${errors.name ? "error" : ""}`} placeholder="My Awesome Project" {...register("name")} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" placeholder="What is this project about?" {...register("description")} />
          </div>

          <div className="form-group">
            <label className="form-label">Project color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {PRESET_COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setValue("color", c)} style={{
                  width: 32, height: 32, borderRadius: "50%", background: c, border: "none",
                  outline: selectedColor === c ? `3px solid ${c}` : "3px solid transparent",
                  outlineOffset: 2, cursor: "pointer", transition: "transform 0.15s",
                  transform: selectedColor === c ? "scale(1.15)" : "scale(1)",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="color" {...register("color")} style={{ width: 40, height: 36, border: "none", background: "none", cursor: "pointer" }} />
              <input className="form-input" style={{ maxWidth: 120 }} {...register("color")} placeholder="#6366f1" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial status</label>
            <select className="form-input form-select" {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Preview */}
          <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, fontWeight: 600 }}>PREVIEW</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, display: "flex",
                alignItems: "center", justifyContent: "center",
                background: selectedColor + "22", border: `2px solid ${selectedColor}44`,
                fontSize: 14, fontWeight: 800, color: selectedColor,
              }}>
                {watch("name")?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{watch("name") || "Project name"}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{watch("description") || "No description"}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating...</> : "Create Project →"}
            </button>
            <Link href="/projects" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

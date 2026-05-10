"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Needs uppercase").regex(/[0-9]/, "Needs a number"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "MEMBER" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signup(data.name, data.email, data.password, data.role);
      toast.success("Account created! Welcome to TaskFlow 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join TaskFlow and start managing tasks</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className={`form-input ${errors.name ? "error" : ""}`} placeholder="John Doe" {...register("name")} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className={`form-input ${errors.email ? "error" : ""}`} type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className={`form-input ${errors.password ? "error" : ""}`} type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" {...register("password")} />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Account role</label>
            <select className="form-input form-select" {...register("role")}>
              <option value="MEMBER">Member — Join and collaborate on projects</option>
              <option value="ADMIN">Admin — Manage all projects and users</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 8, justifyContent: "center" }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : "Create account →"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

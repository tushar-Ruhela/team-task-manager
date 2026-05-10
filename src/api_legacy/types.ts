// Local types for the API — inlined to avoid workspace dependency issues on Railway/Vercel

export type UserRole = "ADMIN" | "MEMBER";
export type ProjectRole = "ADMIN" | "MEMBER";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

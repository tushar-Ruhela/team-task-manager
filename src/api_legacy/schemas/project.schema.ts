import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .default("#6366f1"),
  status: z.enum(["ACTIVE", "ARCHIVED", "COMPLETED"]).optional().default("ACTIVE"),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["ADMIN", "MEMBER"]).optional().default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;

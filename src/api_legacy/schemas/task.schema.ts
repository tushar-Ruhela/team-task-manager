import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  status: z
    .enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"])
    .optional()
    .default("TODO"),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional()
    .default("MEDIUM"),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

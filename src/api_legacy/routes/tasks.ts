import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  requireProjectMember,
  requireProjectAdmin,
} from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../schemas/task.schema";
import {
  listTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getMyTasks,
} from "../controllers/tasks.controller";

import type { Router as RouterType } from "express";
const router: RouterType = Router();

router.use(authenticate);

// My tasks across all projects
router.get("/my-tasks", getMyTasks);

// Project-scoped task routes
router.get("/projects/:projectId/tasks", requireProjectMember, listTasks);
router.post("/projects/:projectId/tasks", requireProjectMember, validate(createTaskSchema), createTask);
router.get("/projects/:projectId/tasks/:id", requireProjectMember, getTask);
router.put("/projects/:projectId/tasks/:id", requireProjectMember, validate(updateTaskSchema), updateTask);
router.patch("/projects/:projectId/tasks/:id/status", requireProjectMember, validate(updateTaskStatusSchema), updateTaskStatus);
router.delete("/projects/:projectId/tasks/:id", requireProjectMember, requireProjectAdmin, deleteTask);

export default router;

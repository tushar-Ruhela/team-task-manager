import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  requireProjectMember,
  requireProjectAdmin,
} from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from "../schemas/project.schema";
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  removeMember,
  updateMemberRole,
  listUsers,
} from "../controllers/projects.controller";

import type { Router as RouterType } from "express";
const router: RouterType = Router();

// All project routes require authentication
router.use(authenticate);

// Projects CRUD
router.get("/", listProjects);
router.post("/", validate(createProjectSchema), createProject);

router.get("/:id", requireProjectMember, getProject);
router.put("/:id", requireProjectMember, requireProjectAdmin, validate(updateProjectSchema), updateProject);
router.delete("/:id", requireProjectMember, requireProjectAdmin, deleteProject);

// Members management
router.get("/:id/members", requireProjectMember, listMembers);
router.post("/:id/members", requireProjectMember, requireProjectAdmin, validate(addMemberSchema), addMember);
router.delete("/:id/members/:userId", requireProjectMember, requireProjectAdmin, removeMember);
router.put("/:id/members/:userId/role", requireProjectMember, requireProjectAdmin, validate(updateMemberRoleSchema), updateMemberRole);

// Search users to add as members
router.get("/:projectId/users/search", requireProjectMember, requireProjectAdmin, listUsers);

export default router;

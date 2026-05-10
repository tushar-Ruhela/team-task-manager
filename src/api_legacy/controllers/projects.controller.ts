import type { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/authenticate";
import type { ProjectAuthRequest } from "../middleware/rbac";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
} from "../schemas/project.schema";

// ─── List all projects for current user ─────────────────────────────────────
export async function listProjects(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "ADMIN";

    const projects = isAdmin
      ? await prisma.project.findMany({
          include: {
            owner: { select: { id: true, name: true, email: true, avatar: true } },
            _count: { select: { members: true, tasks: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.project.findMany({
          where: {
            members: { some: { userId } },
          },
          include: {
            owner: { select: { id: true, name: true, email: true, avatar: true } },
            _count: { select: { members: true, tasks: true } },
            members: {
              where: { userId },
              select: { role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

    const formatted = projects.map((p: typeof projects[0] & { members?: Array<{role: string}> }) => ({
      ...p,
      myRole: p.members?.[0]?.role ?? null,
    }));

    return sendSuccess(res, formatted);
  } catch (err) {
    return next(err);
  }
}

// ─── Create project ──────────────────────────────────────────────────────────
export async function createProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const { name, description, color, status } = req.body as CreateProjectInput;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color,
        status,
        ownerId: userId,
        members: {
          create: { userId, role: "ADMIN" },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { members: true, tasks: true } },
      },
    });

    return sendSuccess(res, project, "Project created", 201);
  } catch (err) {
    return next(err);
  }
}

// ─── Get single project ──────────────────────────────────────────────────────
export async function getProject(
  req: ProjectAuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { members: true, tasks: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            createdBy: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) return sendError(res, "Project not found", 404);

    const myMembership = project.members.find((m: any) => m.userId === userId);
    return sendSuccess(res, {
      ...project,
      myRole: myMembership?.role ?? (req.user?.role === "ADMIN" ? "ADMIN" : null),
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Update project ──────────────────────────────────────────────────────────
export async function updateProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const data = req.body as UpdateProjectInput;

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { members: true, tasks: true } },
      },
    });

    return sendSuccess(res, project, "Project updated");
  } catch (err) {
    return next(err);
  }
}

// ─── Delete project ──────────────────────────────────────────────────────────
export async function deleteProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    await prisma.project.delete({ where: { id } });
    return sendSuccess(res, null, "Project deleted");
  } catch (err) {
    return next(err);
  }
}

// ─── List project members ────────────────────────────────────────────────────
export async function listMembers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { joinedAt: "asc" },
    });
    return sendSuccess(res, members);
  } catch (err) {
    return next(err);
  }
}

// ─── Add member ──────────────────────────────────────────────────────────────
export async function addMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const projectId = req.params.id as string;
    const { userId, role } = req.body as AddMemberInput;

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, "User not found", 404);

    const member = await prisma.projectMember.create({
      data: { projectId, userId, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return sendSuccess(res, member, "Member added", 201);
  } catch (err) {
    return next(err);
  }
}

// ─── Remove member ───────────────────────────────────────────────────────────
export async function removeMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const projectId = req.params.id as string;
    const userId = req.params.userId as string;
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    return sendSuccess(res, null, "Member removed");
  } catch (err) {
    return next(err);
  }
}

// ─── Update member role ──────────────────────────────────────────────────────
export async function updateMemberRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const projectId = req.params.id as string;
    const userId = req.params.userId as string;
    const { role } = req.body;

    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return sendSuccess(res, member, "Role updated");
  } catch (err) {
    return next(err);
  }
}

// ─── List all users (for adding members) ────────────────────────────────────
export async function listUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const projectId = req.params.projectId as string;
    const search = (req.query.search as string) || "";

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
          {
            NOT: {
              projectMembers: { some: { projectId } },
            },
          },
        ],
      },
      select: { id: true, name: true, email: true, avatar: true },
      take: 20,
    });

    return sendSuccess(res, users);
  } catch (err) {
    return next(err);
  }
}

import type { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import type { TaskStatus, TaskPriority } from "@prisma/client";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/authenticate";
import type { CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema";

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  createdBy: { select: { id: true, name: true, email: true, avatar: true } },
};

// ─── List tasks for a project ────────────────────────────────────────────────
export async function listTasks(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        ...(status && { status: status as TaskStatus }),
        ...(priority && { priority: priority as TaskPriority }),
        ...(assigneeId && { assigneeId: assigneeId as string }),
      },
      include: TASK_INCLUDE,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return sendSuccess(res, tasks);
  } catch (err) {
    return next(err);
  }
}

// ─── Create task ─────────────────────────────────────────────────────────────
export async function createTask(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } =
      req.body as CreateTaskInput;

    // Validate assignee is a project member
    if (assigneeId) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!member) {
        return sendError(res, "Assignee must be a project member", 400);
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user!.userId,
      },
      include: TASK_INCLUDE,
    });

    return sendSuccess(res, task, "Task created", 201);
  } catch (err) {
    return next(err);
  }
}

// ─── Get single task ─────────────────────────────────────────────────────────
export async function getTask(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, projectId } = req.params;
    const task = await prisma.task.findFirst({
      where: { id, projectId },
      include: TASK_INCLUDE,
    });
    if (!task) return sendError(res, "Task not found", 404);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

// ─── Update task ─────────────────────────────────────────────────────────────
export async function updateTask(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, projectId } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.task.findFirst({ where: { id, projectId } });
    if (!existing) return sendError(res, "Task not found", 404);

    // Only assignee, creator, or admin can update
    const isAdmin = req.user?.role === "ADMIN";
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    const isProjectAdmin = membership?.role === "ADMIN";
    const isOwner =
      existing.assigneeId === userId || existing.createdById === userId;

    if (!isAdmin && !isProjectAdmin && !isOwner) {
      return sendError(res, "You do not have permission to update this task", 403);
    }

    const { title, description, status, priority, dueDate, assigneeId } =
      req.body as UpdateTaskInput;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: TASK_INCLUDE,
    });

    return sendSuccess(res, task, "Task updated");
  } catch (err) {
    return next(err);
  }
}

// ─── Update task status only ─────────────────────────────────────────────────
export async function updateTaskStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, projectId } = req.params;
    const { status } = req.body;

    const existing = await prisma.task.findFirst({ where: { id, projectId } });
    if (!existing) return sendError(res, "Task not found", 404);

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: TASK_INCLUDE,
    });

    return sendSuccess(res, task, "Status updated");
  } catch (err) {
    return next(err);
  }
}

// ─── Delete task ─────────────────────────────────────────────────────────────
export async function deleteTask(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, projectId } = req.params;
    await prisma.task.deleteMany({ where: { id, projectId } });
    return sendSuccess(res, null, "Task deleted");
  } catch (err) {
    return next(err);
  }
}

// ─── My tasks (assigned to me across all projects) ───────────────────────────
export async function getMyTasks(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        ...(status && { status: status as TaskStatus }),
      },
      include: {
        ...TASK_INCLUDE,
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return sendSuccess(res, tasks);
  } catch (err) {
    return next(err);
  }
}

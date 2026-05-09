import type { Response, NextFunction } from "express";
import prisma from "@ttm/db";
import { sendSuccess } from "../utils/response";
import type { AuthRequest } from "../middleware/authenticate";

export async function getDashboardStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "ADMIN";
    const now = new Date();

    // Project filter: admins see all, members see theirs
    const projectFilter = isAdmin
      ? {}
      : { members: { some: { userId } } };

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      doneTasks,
      overdueTasks,
      recentTasks,
    ] = await Promise.all([
      prisma.project.count({ where: projectFilter }),
      prisma.project.count({ where: { ...projectFilter, status: "ACTIVE" } }),
      prisma.task.count({
        where: isAdmin ? {} : { project: projectFilter },
      }),
      prisma.task.count({
        where: { status: "TODO", ...(isAdmin ? {} : { project: projectFilter }) },
      }),
      prisma.task.count({
        where: { status: "IN_PROGRESS", ...(isAdmin ? {} : { project: projectFilter }) },
      }),
      prisma.task.count({
        where: { status: "REVIEW", ...(isAdmin ? {} : { project: projectFilter }) },
      }),
      prisma.task.count({
        where: { status: "DONE", ...(isAdmin ? {} : { project: projectFilter }) },
      }),
      prisma.task.count({
        where: {
          status: { not: "DONE" },
          dueDate: { lt: now },
          ...(isAdmin ? {} : { project: projectFilter }),
        },
      }),
      prisma.task.findMany({
        where: isAdmin ? {} : { project: projectFilter },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatar: true } },
          project: { select: { id: true, name: true, color: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    // My personal stats
    const [myAssigned, myOverdue] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId, status: { not: "DONE" } } }),
      prisma.task.count({
        where: { assigneeId: userId, status: { not: "DONE" }, dueDate: { lt: now } },
      }),
    ]);

    return sendSuccess(res, {
      totalProjects,
      activeProjects,
      totalTasks,
      tasksByStatus: {
        TODO: todoTasks,
        IN_PROGRESS: inProgressTasks,
        REVIEW: reviewTasks,
        DONE: doneTasks,
      },
      overdueTasks,
      myAssigned,
      myOverdue,
      recentTasks,
    });
  } catch (err) {
    return next(err);
  }
}

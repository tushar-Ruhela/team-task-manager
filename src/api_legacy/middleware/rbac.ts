import type { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import type { AuthRequest } from "./authenticate";

/**
 * Middleware: Checks that the current user is a member of the given project.
 * Attaches `req.projectMember` and `req.projectRole` for downstream use.
 */
export interface ProjectAuthRequest extends AuthRequest {
  projectMember?: {
    id: string;
    role: "ADMIN" | "MEMBER";
  };
}

export function requireProjectMember(
  req: ProjectAuthRequest,
  res: Response,
  next: NextFunction
) {
  const checkMembership = async () => {
    const projectId = (req.params.projectId as string) || (req.params.id as string);
    const userId = req.user?.userId;

    if (!userId || !projectId) {
      return res.status(400).json({ success: false, error: "Missing project or user context" });
    }

    // System admins bypass project membership checks
    if (req.user?.role === "ADMIN") {
      return next();
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
      select: { id: true, role: true },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: "You are not a member of this project",
      });
    }

    req.projectMember = membership as { id: string; role: "ADMIN" | "MEMBER" };
    return next();
  };

  checkMembership().catch(next);
}

/**
 * Middleware: Requires the user to be a project ADMIN (or system ADMIN).
 * Must be used AFTER requireProjectMember.
 */
export function requireProjectAdmin(
  req: ProjectAuthRequest,
  res: Response,
  next: NextFunction
) {
  // System ADMIN bypasses
  if (req.user?.role === "ADMIN") {
    return next();
  }

  if (!req.projectMember || req.projectMember.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: "Project admin access required",
    });
  }

  return next();
}

/**
 * Middleware: Requires the current user to be a system ADMIN.
 */
export function requireSystemAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: "System admin access required",
    });
  }
  return next();
}

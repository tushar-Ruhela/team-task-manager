import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import type { AuthRequest } from "../middleware/authenticate";
import type { SignupInput, LoginInput } from "../schemas/auth.schema";

const REFRESH_COOKIE_NAME = "ttm_refresh_token";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role } = req.body as SignupInput;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, "Email already in use", 409);
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    setRefreshCookie(res, refreshToken);
    return sendSuccess(res, { user, accessToken }, "Account created", 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return sendError(res, "Invalid email or password", 401);
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    setRefreshCookie(res, refreshToken);

    const { password: _, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser, accessToken }, "Login successful");
  } catch (err) {
    return next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) {
      return sendError(res, "No refresh token", 401);
    }

    const payload = verifyRefreshToken(token);

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return sendError(res, "Refresh token expired", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return sendError(res, "User not found", 401);
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });
    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    setRefreshCookie(res, newRefreshToken);
    return sendSuccess(res, { accessToken: newAccessToken }, "Token refreshed");
  } catch (err) {
    return next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.clearCookie(REFRESH_COOKIE_NAME);
    return sendSuccess(res, null, "Logged out");
  } catch (err) {
    return next(err);
  }
}

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: { select: { ownedProjects: true, assignedTasks: true } },
      },
    });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch (err) {
    return next(err);
  }
}

import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400,
  details?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details !== undefined && details !== null ? { details } : {}),
  });
}

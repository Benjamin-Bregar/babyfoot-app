import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JwtUserClaims, UserRole } from "../@types/auth";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

const isUserRole = (role: string): role is UserRole => {
  return role === "admin" || role === "player";
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid bearer token", "UNAUTHORIZED"));
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, env.auth.jwtSecret);

    if (typeof decoded === "string") {
      return next(new AppError(401, "Invalid token payload", "UNAUTHORIZED"));
    }

    const payload = decoded as jwt.JwtPayload & Partial<JwtUserClaims>;

    if (
      typeof payload.sub !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      !isUserRole(payload.role)
    ) {
      return next(new AppError(401, "Invalid token payload", "UNAUTHORIZED"));
    }

    req.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch {
    return next(new AppError(401, "Token is invalid or expired", "UNAUTHORIZED"));
  }
};

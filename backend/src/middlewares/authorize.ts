import { NextFunction, Request, Response } from "express";
import { UserRole } from "../@types/auth";
import { AppError } from "../utils/appError";

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Access denied", "FORBIDDEN"));
    }

    return next();
  };
};

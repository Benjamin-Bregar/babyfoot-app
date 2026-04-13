import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, "Route not found", "NOT_FOUND"));
};

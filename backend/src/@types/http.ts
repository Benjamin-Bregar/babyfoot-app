import { Request } from "express";
import { JwtUserClaims } from "./auth";

export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type TypedRequest<
  TParams = Record<string, string>,
  TQuery = Record<string, unknown>,
  TBody = Record<string, unknown>
> = Request<TParams, unknown, TBody, TQuery>;

export interface AuthenticatedRequest<
  TParams = Record<string, string>,
  TQuery = Record<string, unknown>,
  TBody = Record<string, unknown>
> extends TypedRequest<TParams, TQuery, TBody> {
  user: JwtUserClaims;
}

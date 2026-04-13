import { JwtUserClaims } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserClaims;
    }
  }
}

export {};

import jwt from "jsonwebtoken";
import { JwtUserClaims } from "../@types/auth";
import { env } from "../config/env";

export const signAccessToken = (claims: JwtUserClaims): string => {
  const expiresIn = env.auth.jwtExpiresIn as jwt.SignOptions["expiresIn"];

  return jwt.sign(claims, env.auth.jwtSecret, {
    expiresIn,
  });
};

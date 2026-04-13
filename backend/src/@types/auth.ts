export type UserRole = "admin" | "player";

export interface JwtUserClaims {
  sub: number;
  role: UserRole;
  email: string;
}

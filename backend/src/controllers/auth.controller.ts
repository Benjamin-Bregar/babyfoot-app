import argon2 from "argon2";
import { Request, Response } from "express";
import { Team } from "../models/team.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/appError";
import { signAccessToken } from "../utils/jwt";

type RegisterBody = {
  name: string;
  email: string;
  password: string;
  teamId?: number | null;
};

type LoginBody = {
  email: string;
  password: string;
};

const toUserPayload = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  teamId: user.teamId,
});

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as RegisterBody;
  const { name, email, password, teamId = null } = body;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError(400, "Email is already used", "EMAIL_ALREADY_USED");
  }

  if (teamId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new AppError(400, "teamId references a non-existing team", "INVALID_TEAM_ID");
    }
  }

  const passwordHash = await argon2.hash(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "player",
    teamId,
  });

  const token = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  res.status(201).json({
    data: {
      user: toUserPayload(user),
      token,
    },
    error: null,
  });
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as LoginBody;
  const { email, password } = body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await argon2.verify(user.passwordHash, password);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  const token = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  res.status(200).json({
    data: {
      user: toUserPayload(user),
      token,
    },
    error: null,
  });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }

  const user = await User.findByPk(req.user.sub);
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  res.status(200).json({
    data: {
      user: toUserPayload(user),
    },
    error: null,
  });
};

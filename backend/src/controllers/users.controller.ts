import argon2 from "argon2";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { Team } from "../models/team.model";
import { Tournament } from "../models/tournament.model";
import { TournamentTeam } from "../models/tournamentTeam.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/appError";

type ListUsersQuery = {
  page?: number;
  limit?: number;
  role?: "admin" | "player";
  teamId?: number;
  search?: string;
};

type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "player";
  teamId?: number | null;
};

type UpdateUserBody = Partial<CreateUserBody>;

const toUserPayload = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  teamId: user.teamId,
});

export const listUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = req.query as unknown as ListUsersQuery;
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const offset = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};

  if (query.role) {
    whereClause.role = query.role;
  }

  if (query.teamId) {
    whereClause.teamId = query.teamId;
  }

  if (query.search) {
    whereClause.name = {
      [Op.iLike]: `%${query.search}%`,
    };
  }

  const { rows, count } = await User.findAndCountAll({
    where: whereClause,
    offset,
    limit,
    order: [["id", "ASC"]],
  });

  res.status(200).json({
    data: rows.map(toUserPayload),
    meta: {
      pagination: {
        page,
        limit,
        total: count,
      },
    },
    error: null,
  });
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }

  const userId = Number(req.params.id);

  if (req.user.role === "player" && req.user.sub !== userId) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  res.status(200).json({
    data: toUserPayload(user),
    error: null,
  });
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as CreateUserBody;
  const { name, email, password, role, teamId = null } = body;

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
    role,
    teamId,
  });

  res.status(201).json({
    data: toUserPayload(user),
    error: null,
  });
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as UpdateUserBody;
  const userId = Number(req.params.id);
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const payload: Partial<{
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "player";
    teamId: number | null;
  }> = {};

  if (body.name !== undefined) payload.name = body.name;
  if (body.email !== undefined) payload.email = body.email;
  if (body.role !== undefined) payload.role = body.role;
  if (body.teamId !== undefined) payload.teamId = body.teamId;

  if (payload.teamId) {
    const team = await Team.findByPk(payload.teamId);
    if (!team) {
      throw new AppError(400, "teamId references a non-existing team", "INVALID_TEAM_ID");
    }
  }

  if (body.password !== undefined) {
    payload.passwordHash = await argon2.hash(body.password);
  }

  if (payload.email && payload.email !== user.email) {
    const emailOwner = await User.findOne({ where: { email: payload.email } });
    if (emailOwner) {
      throw new AppError(400, "Email is already used", "EMAIL_ALREADY_USED");
    }
  }

  await user.update(payload);

  res.status(200).json({
    data: toUserPayload(user),
    error: null,
  });
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = Number(req.params.id);
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  await user.destroy();
  res.status(204).send();
};

export const listMyTournaments = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }

  const currentUser = await User.findByPk(req.user.sub);

  if (!currentUser) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  if (!currentUser.teamId) {
    res.status(200).json({
      data: [],
      error: null,
    });
    return;
  }

  const links = await TournamentTeam.findAll({
    where: {
      teamId: currentUser.teamId,
    },
    order: [["id", "ASC"]],
  });

  const tournamentIds = links.map((item) => item.tournamentId);
  if (tournamentIds.length === 0) {
    res.status(200).json({
      data: [],
      error: null,
    });
    return;
  }

  const tournaments = await Tournament.findAll({
    where: {
      id: {
        [Op.in]: tournamentIds,
      },
    },
    order: [["id", "ASC"]],
  });

  res.status(200).json({
    data: tournaments,
    error: null,
  });
};

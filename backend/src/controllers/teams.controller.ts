import { Request, Response } from "express";
import { Op } from "sequelize";
import { Team } from "../models/team.model";
import { AppError } from "../utils/appError";

type ListTeamsQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

type TeamPayload = {
  name: string;
};

export const listTeams = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = req.query as unknown as ListTeamsQuery;
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const offset = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};
  if (query.search) {
    whereClause.name = {
      [Op.iLike]: `%${query.search}%`,
    };
  }

  const { rows, count } = await Team.findAndCountAll({
    where: whereClause,
    offset,
    limit,
    order: [["id", "ASC"]],
  });

  res.status(200).json({
    data: rows,
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

export const getTeamById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const team = await Team.findByPk(Number(req.params.id));

  if (!team) {
    throw new AppError(404, "Team not found", "TEAM_NOT_FOUND");
  }

  res.status(200).json({
    data: team,
    error: null,
  });
};

export const createTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as TeamPayload;
  const existingTeam = await Team.findOne({ where: { name: body.name } });
  if (existingTeam) {
    throw new AppError(400, "Team name already exists", "TEAM_NAME_ALREADY_USED");
  }

  const team = await Team.create({ name: body.name });

  res.status(201).json({
    data: team,
    error: null,
  });
};

export const updateTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as TeamPayload;
  const team = await Team.findByPk(Number(req.params.id));
  if (!team) {
    throw new AppError(404, "Team not found", "TEAM_NOT_FOUND");
  }

  if (body.name !== team.name) {
    const existingTeam = await Team.findOne({ where: { name: body.name } });
    if (existingTeam) {
      throw new AppError(400, "Team name already exists", "TEAM_NAME_ALREADY_USED");
    }
  }

  await team.update({ name: body.name });

  res.status(200).json({
    data: team,
    error: null,
  });
};

export const deleteTeam = async (
  req: Request,
  res: Response
): Promise<void> => {
  const team = await Team.findByPk(Number(req.params.id));
  if (!team) {
    throw new AppError(404, "Team not found", "TEAM_NOT_FOUND");
  }

  await team.destroy();
  res.status(204).send();
};

import { Request, Response } from "express";
import { Op } from "sequelize";
import { Match } from "../models/match.model";
import { MatchTeam } from "../models/matchTeam.model";
import { Team } from "../models/team.model";
import { Tournament } from "../models/tournament.model";
import { TournamentTeam } from "../models/tournamentTeam.model";
import { User } from "../models/user.model";
import { sequelize } from "../services/database";
import { AppError } from "../utils/appError";

type ListTournamentsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
};

type TournamentPayload = {
  name: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  description?: string | null;
};

type RegisterTournamentTeamBody = {
  teamId: number;
};

type ScheduleRoundRobinBody = {
  startAt?: string;
  intervalMinutes?: number;
  roundsLabelPrefix?: string;
};

const toDateOnly = (dateInput: string | Date): string => {
  if (typeof dateInput === "string") {
    return dateInput.slice(0, 10);
  }

  return dateInput.toISOString().slice(0, 10);
};

type RoundRobinPair = {
  round: number;
  homeTeamId: number;
  awayTeamId: number;
};

const buildRoundRobinPairs = (teamIds: number[]): RoundRobinPair[] => {
  const participants: Array<number | null> = [...teamIds];
  if (participants.length % 2 !== 0) {
    participants.push(null);
  }

  const rounds = participants.length - 1;
  const half = participants.length / 2;
  const output: RoundRobinPair[] = [];

  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    for (let index = 0; index < half; index += 1) {
      const home = participants[index];
      const away = participants[participants.length - 1 - index];

      if (home !== null && away !== null) {
        output.push({
          round: roundIndex + 1,
          homeTeamId: home,
          awayTeamId: away,
        });
      }
    }

    const fixed = participants[0];
    const rotated = participants.slice(1);
    rotated.unshift(rotated.pop() ?? null);
    participants.splice(0, participants.length, fixed, ...rotated);
  }

  return output;
};

export const listTournaments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = req.query as unknown as ListTournamentsQuery;
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const offset = (page - 1) * limit;

  const whereClause: any = {};

  if (query.search) {
    whereClause.name = {
      [Op.iLike]: `%${query.search}%`,
    };
  }

  if (query.startDate || query.endDate) {
    whereClause.startDate = {};
    if (query.startDate) {
      whereClause.startDate[Op.gte] = query.startDate;
    }
    if (query.endDate) {
      whereClause.startDate[Op.lte] = query.endDate;
    }
  }

  const { rows, count } = await Tournament.findAndCountAll({
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

export const getTournamentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tournament = await Tournament.findByPk(Number(req.params.id));

  if (!tournament) {
    throw new AppError(404, "Tournament not found", "TOURNAMENT_NOT_FOUND");
  }

  res.status(200).json({
    data: tournament,
    error: null,
  });
};

export const createTournament = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as TournamentPayload;
  const tournament = await Tournament.create({
    name: body.name,
    startDate: toDateOnly(body.startDate),
    endDate: body.endDate ? toDateOnly(body.endDate) : null,
    description: body.description ?? null,
  });

  res.status(201).json({
    data: tournament,
    error: null,
  });
};

export const updateTournament = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as Partial<TournamentPayload>;
  const tournament = await Tournament.findByPk(Number(req.params.id));
  if (!tournament) {
    throw new AppError(404, "Tournament not found", "TOURNAMENT_NOT_FOUND");
  }

  const payload: Partial<{
    name: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
  }> = {};

  if (body.name !== undefined) payload.name = body.name;
  if (body.startDate !== undefined) payload.startDate = toDateOnly(body.startDate);
  if (body.endDate !== undefined) payload.endDate = body.endDate ? toDateOnly(body.endDate) : null;
  if (body.description !== undefined) payload.description = body.description;

  const effectiveStartDate = payload.startDate ?? tournament.startDate;
  const effectiveEndDate = payload.endDate ?? tournament.endDate;

  if (effectiveEndDate && effectiveEndDate < effectiveStartDate) {
    throw new AppError(400, "endDate must be greater than or equal to startDate", "INVALID_DATES");
  }

  await tournament.update(payload);

  res.status(200).json({
    data: tournament,
    error: null,
  });
};

export const deleteTournament = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tournament = await Tournament.findByPk(Number(req.params.id));

  if (!tournament) {
    throw new AppError(404, "Tournament not found", "TOURNAMENT_NOT_FOUND");
  }

  await tournament.destroy();
  res.status(204).send();
};

export const listTournamentTeams = async (req: Request, res: Response): Promise<void> => {
  const tournamentId = Number(req.params.id);
  const tournament = await Tournament.findByPk(tournamentId);

  if (!tournament) {
    throw new AppError(404, "Tournament not found", "TOURNAMENT_NOT_FOUND");
  }

  const links = await TournamentTeam.findAll({
    where: { tournamentId },
    order: [["id", "ASC"]],
  });

  const teamIds = links.map((item) => item.teamId);
  const teams = teamIds.length
    ? await Team.findAll({
        where: {
          id: {
            [Op.in]: teamIds,
          },
        },
      })
    : [];

  const nameByTeamId = new Map<number, string>();
  for (const team of teams) {
    nameByTeamId.set(team.id, team.name);
  }

  res.status(200).json({
    data: links.map((link) => ({
      id: link.id,
      tournamentId: link.tournamentId,
      teamId: link.teamId,
      teamName: nameByTeamId.get(link.teamId) ?? null,
      played: link.played,
      won: link.won,
      drawn: link.drawn,
      lost: link.lost,
      points: link.points,
    })),
    error: null,
  });
};

export const registerTournamentTeam = async (req: Request, res: Response): Promise<void> => {
  const tournamentId = Number(req.params.id);
  const body = req.body as RegisterTournamentTeamBody;

  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }

  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) {
    throw new AppError(404, "Tournament not found", "TOURNAMENT_NOT_FOUND");
  }

  const team = await Team.findByPk(body.teamId);
  if (!team) {
    throw new AppError(400, "teamId references a non-existing team", "INVALID_TEAM_ID");
  }

  if (req.user.role === "player") {
    const currentUser = await User.findByPk(req.user.sub);
    if (!currentUser) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    if (!currentUser.teamId || currentUser.teamId !== body.teamId) {
      throw new AppError(403, "Player can only register their own team", "FORBIDDEN");
    }
  }

  const existing = await TournamentTeam.findOne({
    where: {
      tournamentId,
      teamId: body.teamId,
    },
  });

  if (existing) {
    throw new AppError(400, "Team is already registered in this tournament", "TOURNAMENT_TEAM_EXISTS");
  }

  const created = await TournamentTeam.create({
    tournamentId,
    teamId: body.teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
  });

  res.status(201).json({
    data: created,
    error: null,
  });
};

export const removeTournamentTeam = async (req: Request, res: Response): Promise<void> => {
  const tournamentId = Number(req.params.id);
  const teamId = Number(req.params.teamId);

  const link = await TournamentTeam.findOne({
    where: {
      tournamentId,
      teamId,
    },
  });

  if (!link) {
    throw new AppError(404, "Tournament team link not found", "TOURNAMENT_TEAM_NOT_FOUND");
  }

  await link.destroy();
  res.status(204).send();
};

export const scheduleRoundRobin = async (req: Request, res: Response): Promise<void> => {
  const tournamentId = Number(req.params.id);
  const body = req.body as ScheduleRoundRobinBody;
  const intervalMinutes = body.intervalMinutes ?? 60;
  const roundsLabelPrefix = body.roundsLabelPrefix ?? "Round";

  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) {
    throw new AppError(404, "Tournament not found", "TOURNAMENT_NOT_FOUND");
  }

  const existingMatchCount = await Match.count({ where: { tournamentId } });
  if (existingMatchCount > 0) {
    throw new AppError(
      400,
      "Schedule already exists for this tournament",
      "SCHEDULE_ALREADY_EXISTS"
    );
  }

  const participants = await TournamentTeam.findAll({
    where: { tournamentId },
    order: [["id", "ASC"]],
  });

  const teamIds = participants.map((item) => item.teamId);
  if (teamIds.length < 2) {
    throw new AppError(
      400,
      "At least two registered teams are required to generate a schedule",
      "NOT_ENOUGH_TEAMS"
    );
  }

  const pairs = buildRoundRobinPairs(teamIds);
  const firstMatchDate = body.startAt
    ? new Date(body.startAt)
    : new Date(`${tournament.startDate}T12:00:00.000Z`);

  await sequelize.transaction(async (transaction) => {
    for (let index = 0; index < pairs.length; index += 1) {
      const pair = pairs[index];
      const matchDate = new Date(firstMatchDate.getTime() + index * intervalMinutes * 60 * 1000);

      const match = await Match.create(
        {
          tournamentId,
          matchDate,
          round: `${roundsLabelPrefix} ${pair.round}`,
          status: "scheduled",
        },
        { transaction }
      );

      await MatchTeam.bulkCreate(
        [
          {
            matchId: match.id,
            teamId: pair.homeTeamId,
            score: null,
          },
          {
            matchId: match.id,
            teamId: pair.awayTeamId,
            score: null,
          },
        ],
        { transaction }
      );
    }
  });

  const createdMatches = await Match.findAll({
    where: { tournamentId },
    order: [["id", "ASC"]],
  });

  res.status(201).json({
    data: {
      count: createdMatches.length,
      matchIds: createdMatches.map((match) => match.id),
    },
    error: null,
  });
};

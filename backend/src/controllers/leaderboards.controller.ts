import { Request, Response } from "express";
import { Op } from "sequelize";
import { MatchPlayer } from "../models/matchPlayer.model";
import { Team } from "../models/team.model";
import { Tournament } from "../models/tournament.model";
import { TournamentTeam } from "../models/tournamentTeam.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/appError";

type TournamentLeaderboardQuery = {
  sort?: "points" | "won" | "drawn" | "lost" | "played";
  order?: "asc" | "desc";
  limit?: number;
};

type GlobalPlayerLeaderboardQuery = {
  page?: number;
  limit?: number;
  sort?: "goals" | "appearances";
  order?: "asc" | "desc";
};

export const getTournamentLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const tournamentId = Number(req.params.id);
  const query = req.query as unknown as TournamentLeaderboardQuery;
  const sort = query.sort ?? "points";
  const order = query.order ?? "desc";
  const limit = Number(query.limit ?? 20);

  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) {
    throw new AppError(404, "Tournament not found", "TOURNAMENT_NOT_FOUND");
  }

  const standings = await TournamentTeam.findAll({
    where: { tournamentId },
    order: [["id", "ASC"]],
  });

  const teamIds = standings.map((item) => item.teamId);
  const teams = teamIds.length
    ? await Team.findAll({
        where: {
          id: {
            [Op.in]: teamIds,
          },
        },
      })
    : [];

  const teamNameById = new Map<number, string>();
  for (const team of teams) {
    teamNameById.set(team.id, team.name);
  }

  const rows = standings.map((row) => ({
    teamId: row.teamId,
    teamName: teamNameById.get(row.teamId) ?? null,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    points: row.points,
  }));

  rows.sort((a, b) => {
    const direction = order === "asc" ? 1 : -1;
    const primary = (a[sort] as number) - (b[sort] as number);
    if (primary !== 0) {
      return primary * direction;
    }
    return (a.teamId - b.teamId) * direction;
  });

  res.status(200).json({
    data: {
      tournamentId,
      standings: rows.slice(0, limit),
    },
    error: null,
  });
};

export const getGlobalPlayerLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as GlobalPlayerLeaderboardQuery;
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const offset = (page - 1) * limit;
  const sort = query.sort ?? "goals";
  const order = query.order ?? "desc";

  const statsRows = await MatchPlayer.findAll();

  const byPlayer = new Map<number, { goals: number; appearances: number }>();
  for (const row of statsRows) {
    const current = byPlayer.get(row.playerId) ?? { goals: 0, appearances: 0 };
    current.goals += row.goals;
    current.appearances += 1;
    byPlayer.set(row.playerId, current);
  }

  const playerIds = Array.from(byPlayer.keys());
  const users = playerIds.length
    ? await User.findAll({
        where: {
          id: {
            [Op.in]: playerIds,
          },
        },
      })
    : [];

  const rows = users.map((user) => {
    const stats = byPlayer.get(user.id) ?? { goals: 0, appearances: 0 };
    return {
      playerId: user.id,
      name: user.name,
      email: user.email,
      teamId: user.teamId,
      goals: stats.goals,
      appearances: stats.appearances,
    };
  });

  rows.sort((a, b) => {
    const direction = order === "asc" ? 1 : -1;
    const primary = (a[sort] as number) - (b[sort] as number);
    if (primary !== 0) {
      return primary * direction;
    }
    return (a.playerId - b.playerId) * direction;
  });

  const pagedRows = rows.slice(offset, offset + limit);

  res.status(200).json({
    data: pagedRows,
    meta: {
      pagination: {
        page,
        limit,
        total: rows.length,
      },
    },
    error: null,
  });
};

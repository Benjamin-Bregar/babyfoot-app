import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { Match, MatchStatus } from "../models/match.model";
import { MatchPlayer } from "../models/matchPlayer.model";
import { MatchTeam } from "../models/matchTeam.model";
import { Team } from "../models/team.model";
import { Tournament } from "../models/tournament.model";
import { TournamentTeam } from "../models/tournamentTeam.model";
import { User } from "../models/user.model";
import { sequelize } from "../services/database";
import { AppError } from "../utils/appError";

type ListMatchesQuery = {
  page?: number;
  limit?: number;
  tournamentId?: number;
  status?: MatchStatus;
};

type CreateMatchBody = {
  tournamentId: number;
  matchDate?: string | null;
  round?: string | null;
  status?: MatchStatus;
  teamIds?: number[];
};

type UpdateMatchBody = {
  matchDate?: string | null;
  round?: string | null;
  status?: MatchStatus;
};

type MatchScoreBody = {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
};

type CreateMatchPlayerBody = {
  playerId: number;
  goals?: number;
};

type UpdateMatchPlayerBody = {
  goals: number;
};

const isAllowedTransition = (currentStatus: MatchStatus, nextStatus: MatchStatus): boolean => {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "scheduled") {
    return nextStatus === "in_progress" || nextStatus === "completed" || nextStatus === "cancelled";
  }

  if (currentStatus === "in_progress") {
    return nextStatus === "completed" || nextStatus === "cancelled";
  }

  return false;
};

const toPayloadMatch = async (match: Match): Promise<Record<string, unknown>> => {
  const links = await MatchTeam.findAll({
    where: { matchId: match.id },
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

  const teamNameById = new Map<number, string>();
  for (const team of teams) {
    teamNameById.set(team.id, team.name);
  }

  return {
    id: match.id,
    tournamentId: match.tournamentId,
    matchDate: match.matchDate,
    round: match.round,
    status: match.status,
    teams: links.map((link) => ({
      teamId: link.teamId,
      teamName: teamNameById.get(link.teamId) ?? null,
      score: link.score,
    })),
  };
};

const recomputeTournamentStandings = async (
  tournamentId: number,
  transaction: Transaction
): Promise<void> => {
  const standingRows = await TournamentTeam.findAll({
    where: { tournamentId },
    transaction,
  });

  const statsByTeam = new Map<
    number,
    { played: number; won: number; drawn: number; lost: number; points: number }
  >();

  for (const row of standingRows) {
    statsByTeam.set(row.teamId, {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
    });
  }

  if (standingRows.length === 0) {
    return;
  }

  const completedMatches = await Match.findAll({
    where: {
      tournamentId,
      status: "completed",
    },
    attributes: ["id"],
    transaction,
  });

  const matchIds = completedMatches.map((item) => item.id);
  if (matchIds.length === 0) {
    for (const row of standingRows) {
      await row.update(
        {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          points: 0,
        },
        { transaction }
      );
    }
    return;
  }

  const matchTeams = await MatchTeam.findAll({
    where: {
      matchId: {
        [Op.in]: matchIds,
      },
    },
    order: [["id", "ASC"]],
    transaction,
  });

  const entriesByMatchId = new Map<number, MatchTeam[]>();
  for (const row of matchTeams) {
    const list = entriesByMatchId.get(row.matchId) ?? [];
    list.push(row);
    entriesByMatchId.set(row.matchId, list);
  }

  for (const matchId of matchIds) {
    const entries = (entriesByMatchId.get(matchId) ?? []).filter((item) => item.score !== null);
    if (entries.length < 2) {
      continue;
    }

    const [first, second] = entries;
    const firstStats = statsByTeam.get(first.teamId);
    const secondStats = statsByTeam.get(second.teamId);
    if (!firstStats || !secondStats || first.score === null || second.score === null) {
      continue;
    }

    firstStats.played += 1;
    secondStats.played += 1;

    if (first.score > second.score) {
      firstStats.won += 1;
      firstStats.points += 3;
      secondStats.lost += 1;
    } else if (first.score < second.score) {
      secondStats.won += 1;
      secondStats.points += 3;
      firstStats.lost += 1;
    } else {
      firstStats.drawn += 1;
      secondStats.drawn += 1;
      firstStats.points += 1;
      secondStats.points += 1;
    }
  }

  for (const row of standingRows) {
    const stats = statsByTeam.get(row.teamId);
    if (!stats) {
      continue;
    }

    await row.update(stats, { transaction });
  }
};

const ensurePlayerBelongsToMatchTeams = async (matchId: number, playerId: number): Promise<void> => {
  const player = await User.findByPk(playerId);
  if (!player) {
    throw new AppError(404, "Player not found", "PLAYER_NOT_FOUND");
  }

  if (!player.teamId) {
    throw new AppError(400, "Player is not assigned to a team", "PLAYER_WITHOUT_TEAM");
  }

  const link = await MatchTeam.findOne({
    where: {
      matchId,
      teamId: player.teamId,
    },
  });

  if (!link) {
    throw new AppError(
      400,
      "Player's team is not part of this match",
      "PLAYER_TEAM_NOT_IN_MATCH"
    );
  }
};

export const listMatches = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as ListMatchesQuery;
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const offset = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};
  if (query.tournamentId) {
    whereClause.tournamentId = Number(query.tournamentId);
  }
  if (query.status) {
    whereClause.status = query.status;
  }

  const { rows, count } = await Match.findAndCountAll({
    where: whereClause,
    offset,
    limit,
    order: [["id", "ASC"]],
  });

  const data = await Promise.all(rows.map((item) => toPayloadMatch(item)));

  res.status(200).json({
    data,
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

export const getMatchById = async (req: Request, res: Response): Promise<void> => {
  const match = await Match.findByPk(Number(req.params.id));
  if (!match) {
    throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
  }

  res.status(200).json({
    data: await toPayloadMatch(match),
    error: null,
  });
};

export const createMatch = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateMatchBody;

  const tournament = await Tournament.findByPk(body.tournamentId);
  if (!tournament) {
    throw new AppError(400, "tournamentId references a non-existing tournament", "INVALID_TOURNAMENT_ID");
  }

  if (body.teamIds && body.teamIds.length === 2 && body.teamIds[0] === body.teamIds[1]) {
    throw new AppError(400, "teamIds must contain two distinct teams", "INVALID_TEAM_IDS");
  }

  await sequelize.transaction(async (transaction) => {
    const match = await Match.create(
      {
        tournamentId: body.tournamentId,
        matchDate: body.matchDate ? new Date(body.matchDate) : null,
        round: body.round ?? null,
        status: body.status ?? "scheduled",
      },
      { transaction }
    );

    if (body.teamIds && body.teamIds.length === 2) {
      const teams = await Team.findAll({
        where: {
          id: {
            [Op.in]: body.teamIds,
          },
        },
        transaction,
      });

      if (teams.length !== 2) {
        throw new AppError(400, "teamIds contain non-existing team references", "INVALID_TEAM_IDS");
      }

      const tournamentLinks = await TournamentTeam.findAll({
        where: {
          tournamentId: body.tournamentId,
          teamId: {
            [Op.in]: body.teamIds,
          },
        },
        transaction,
      });

      if (tournamentLinks.length !== 2) {
        throw new AppError(400, "Both teams must be registered in this tournament", "TEAM_NOT_REGISTERED");
      }

      await MatchTeam.bulkCreate(
        body.teamIds.map((teamId) => ({
          matchId: match.id,
          teamId,
          score: null,
        })),
        { transaction }
      );
    }

    const created = await Match.findByPk(match.id, { transaction });
    if (!created) {
      throw new AppError(500, "Failed to create match", "MATCH_CREATE_FAILED");
    }

    res.status(201).json({
      data: await toPayloadMatch(created),
      error: null,
    });
  });
};

export const updateMatch = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as UpdateMatchBody;
  const match = await Match.findByPk(Number(req.params.id));

  if (!match) {
    throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
  }

  if (body.status && !isAllowedTransition(match.status, body.status)) {
    throw new AppError(
      400,
      `Cannot transition match status from ${match.status} to ${body.status}`,
      "INVALID_MATCH_STATUS_TRANSITION"
    );
  }

  await match.update({
    matchDate: body.matchDate !== undefined ? (body.matchDate ? new Date(body.matchDate) : null) : match.matchDate,
    round: body.round !== undefined ? body.round : match.round,
    status: body.status ?? match.status,
  });

  res.status(200).json({
    data: await toPayloadMatch(match),
    error: null,
  });
};

export const deleteMatch = async (req: Request, res: Response): Promise<void> => {
  const match = await Match.findByPk(Number(req.params.id));

  if (!match) {
    throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
  }

  await match.destroy();
  res.status(204).send();
};

export const patchMatchScore = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as MatchScoreBody;
  const match = await Match.findByPk(Number(req.params.id));

  if (!match) {
    throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
  }

  if (match.status === "cancelled") {
    throw new AppError(400, "Cannot set score on a cancelled match", "INVALID_MATCH_STATE");
  }

  await sequelize.transaction(async (transaction) => {
    const links = await MatchTeam.findAll({
      where: {
        matchId: match.id,
        teamId: {
          [Op.in]: [body.homeTeamId, body.awayTeamId],
        },
      },
      transaction,
    });

    if (links.length !== 2) {
      throw new AppError(400, "Teams are not assigned to this match", "TEAM_NOT_IN_MATCH");
    }

    await MatchTeam.update(
      { score: body.homeScore },
      {
        where: {
          matchId: match.id,
          teamId: body.homeTeamId,
        },
        transaction,
      }
    );

    await MatchTeam.update(
      { score: body.awayScore },
      {
        where: {
          matchId: match.id,
          teamId: body.awayTeamId,
        },
        transaction,
      }
    );

    if (match.status !== "completed") {
      await match.update({ status: "completed" }, { transaction });
    }

    await recomputeTournamentStandings(match.tournamentId, transaction);
  });

  const updated = await Match.findByPk(match.id);
  if (!updated) {
    throw new AppError(500, "Failed to load updated match", "MATCH_UPDATE_FAILED");
  }

  res.status(200).json({
    data: await toPayloadMatch(updated),
    error: null,
  });
};

export const listMatchPlayers = async (req: Request, res: Response): Promise<void> => {
  const matchId = Number(req.params.id);
  const match = await Match.findByPk(matchId);
  if (!match) {
    throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
  }

  const rows = await MatchPlayer.findAll({
    where: { matchId },
    order: [["id", "ASC"]],
  });

  const playerIds = rows.map((row) => row.playerId);
  const players = playerIds.length
    ? await User.findAll({
        where: {
          id: {
            [Op.in]: playerIds,
          },
        },
      })
    : [];

  const playerById = new Map<number, User>();
  for (const player of players) {
    playerById.set(player.id, player);
  }

  res.status(200).json({
    data: rows.map((row) => {
      const player = playerById.get(row.playerId);
      return {
        id: row.id,
        matchId: row.matchId,
        playerId: row.playerId,
        playerName: player?.name ?? null,
        teamId: player?.teamId ?? null,
        goals: row.goals,
      };
    }),
    error: null,
  });
};

export const createMatchPlayer = async (req: Request, res: Response): Promise<void> => {
  const matchId = Number(req.params.id);
  const body = req.body as CreateMatchPlayerBody;

  const match = await Match.findByPk(matchId);
  if (!match) {
    throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
  }

  await ensurePlayerBelongsToMatchTeams(matchId, body.playerId);

  const existing = await MatchPlayer.findOne({
    where: {
      matchId,
      playerId: body.playerId,
    },
  });

  if (existing) {
    throw new AppError(400, "Player stats already exist for this match", "MATCH_PLAYER_EXISTS");
  }

  const created = await MatchPlayer.create({
    matchId,
    playerId: body.playerId,
    goals: body.goals ?? 0,
  });

  res.status(201).json({
    data: created,
    error: null,
  });
};

export const updateMatchPlayer = async (req: Request, res: Response): Promise<void> => {
  const matchId = Number(req.params.id);
  const playerId = Number(req.params.playerId);
  const body = req.body as UpdateMatchPlayerBody;

  const match = await Match.findByPk(matchId);
  if (!match) {
    throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
  }

  const row = await MatchPlayer.findOne({
    where: {
      matchId,
      playerId,
    },
  });

  if (!row) {
    throw new AppError(404, "Match player stats not found", "MATCH_PLAYER_NOT_FOUND");
  }

  await ensurePlayerBelongsToMatchTeams(matchId, playerId);
  await row.update({ goals: body.goals });

  res.status(200).json({
    data: row,
    error: null,
  });
};

export const deleteMatchPlayer = async (req: Request, res: Response): Promise<void> => {
  const matchId = Number(req.params.id);
  const playerId = Number(req.params.playerId);

  const row = await MatchPlayer.findOne({
    where: {
      matchId,
      playerId,
    },
  });

  if (!row) {
    throw new AppError(404, "Match player stats not found", "MATCH_PLAYER_NOT_FOUND");
  }

  await row.destroy();
  res.status(204).send();
};

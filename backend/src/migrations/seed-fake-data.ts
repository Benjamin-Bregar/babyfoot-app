import argon2 from "argon2";
import { MatchStatus } from "../models/match.model";
import { initializeModels, models } from "../models";
import { env } from "../config/env";
import { sequelize } from "../services/database";

const teamSeeds = [
  "Red Comets",
  "Blue Rockets",
  "Golden Kickers",
  "Night Strikers",
  "Green Meteors",
];

const adminSeeds = [
  { name: "Admin One", email: "admin1@babyfoot.dev" },
  { name: "Admin Two", email: "admin2@babyfoot.dev" },
];

const playerNames = [
  "Liam",
  "Emma",
  "Noah",
  "Olivia",
  "Lucas",
  "Ava",
  "Ethan",
  "Mia",
  "Leo",
  "Chloe",
  "Adam",
  "Sofia",
  "Hugo",
  "Lina",
  "Nolan",
  "Sarah",
  "Malo",
  "Ines",
];

const tournamentSeeds = [
  {
    name: "Spring Cup",
    startDate: "2026-04-15",
    endDate: "2026-04-30",
    description: "Local spring tournament",
    teamIndexes: [0, 1, 2, 3],
  },
  {
    name: "Summer Open",
    startDate: "2026-06-01",
    endDate: "2026-06-20",
    description: "Pre-summer preparation cup",
    teamIndexes: [1, 2, 3, 4],
  },
];

type Standing = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
};

const buildRoundRobinPairs = (teamIds: number[]): Array<[number, number]> => {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < teamIds.length; i += 1) {
    for (let j = i + 1; j < teamIds.length; j += 1) {
      pairs.push([teamIds[i], teamIds[j]]);
    }
  }
  return pairs;
};

const updateStanding = (
  standings: Record<number, Standing>,
  homeTeamId: number,
  awayTeamId: number,
  homeScore: number,
  awayScore: number
): void => {
  standings[homeTeamId].played += 1;
  standings[awayTeamId].played += 1;

  if (homeScore > awayScore) {
    standings[homeTeamId].won += 1;
    standings[homeTeamId].points += 3;
    standings[awayTeamId].lost += 1;
    return;
  }

  if (awayScore > homeScore) {
    standings[awayTeamId].won += 1;
    standings[awayTeamId].points += 3;
    standings[homeTeamId].lost += 1;
    return;
  }

  standings[homeTeamId].drawn += 1;
  standings[awayTeamId].drawn += 1;
  standings[homeTeamId].points += 1;
  standings[awayTeamId].points += 1;
};

const seedDatabase = async (): Promise<void> => {
  if (env.app.nodeEnv === "production") {
    throw new Error("Refusing to run db:seed in production");
  }

  initializeModels();
  await sequelize.authenticate();
  await sequelize.sync();

  if ((await models.Team.count()) > 0) {
    throw new Error("Database already contains data. Run npm run db:reset before seeding.");
  }

  const adminPasswordHash = await argon2.hash("AdminPass123!");
  const playerPasswordHash = await argon2.hash("PlayerPass123!");

  const transaction = await sequelize.transaction();

  try {
    const teams = await models.Team.bulkCreate(
      teamSeeds.map((name) => ({ name })),
      { transaction, returning: true }
    );

    await models.User.bulkCreate(
      adminSeeds.map((admin) => ({
        name: admin.name,
        email: admin.email,
        passwordHash: adminPasswordHash,
        role: "admin",
        teamId: null,
      })),
      { transaction }
    );

    const playersToCreate = playerNames.map((name, index) => {
      const teamIndex = index % teams.length;
      const teamId = teams[teamIndex].id;

      return {
        name: `${name} Player`,
        email: `${name.toLowerCase()}.${index + 1}@babyfoot.dev`,
        passwordHash: playerPasswordHash,
        role: "player" as const,
        teamId,
      };
    });

    const players = await models.User.bulkCreate(playersToCreate, {
      transaction,
      returning: true,
    });

    const playersByTeam = new Map<number, Array<number>>();
    for (const player of players) {
      if (!player.teamId) {
        continue;
      }
      const bucket = playersByTeam.get(player.teamId) ?? [];
      bucket.push(player.id);
      playersByTeam.set(player.teamId, bucket);
    }

    for (const tournamentSeed of tournamentSeeds) {
      const tournament = await models.Tournament.create(
        {
          name: tournamentSeed.name,
          startDate: tournamentSeed.startDate,
          endDate: tournamentSeed.endDate,
          description: tournamentSeed.description,
        },
        { transaction }
      );

      const participatingTeamIds = tournamentSeed.teamIndexes.map((index) => teams[index].id);
      const standings: Record<number, Standing> = {};

      for (const teamId of participatingTeamIds) {
        standings[teamId] = {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          points: 0,
        };
      }

      const matchPairs = buildRoundRobinPairs(participatingTeamIds);
      const createdStandings = await models.TournamentTeam.bulkCreate(
        participatingTeamIds.map((teamId) => ({
          tournamentId: tournament.id,
          teamId,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          points: 0,
        })),
        { transaction, returning: true }
      );

      const baseDate = new Date(`${tournamentSeed.startDate}T18:00:00.000Z`);

      for (let index = 0; index < matchPairs.length; index += 1) {
        const [homeTeamId, awayTeamId] = matchPairs[index];
        const matchStatus: MatchStatus = index % 2 === 0 ? "completed" : "scheduled";

        const matchDate = new Date(baseDate.getTime() + index * 1000 * 60 * 90);
        const match = await models.Match.create(
          {
            tournamentId: tournament.id,
            matchDate,
            round: `Round ${index + 1}`,
            status: matchStatus,
          },
          { transaction }
        );

        const homeScore = matchStatus === "completed" ? (index + 2) % 5 : null;
        const awayScore = matchStatus === "completed" ? (index + 1) % 4 : null;

        await models.MatchTeam.bulkCreate(
          [
            {
              matchId: match.id,
              teamId: homeTeamId,
              score: homeScore,
            },
            {
              matchId: match.id,
              teamId: awayTeamId,
              score: awayScore,
            },
          ],
          { transaction }
        );

        if (matchStatus === "completed" && homeScore !== null && awayScore !== null) {
          updateStanding(standings, homeTeamId, awayTeamId, homeScore, awayScore);

          const homePlayers = playersByTeam.get(homeTeamId) ?? [];
          const awayPlayers = playersByTeam.get(awayTeamId) ?? [];

          const selectedHomePlayers = homePlayers.slice(0, 2);
          const selectedAwayPlayers = awayPlayers.slice(0, 2);

          const matchPlayerRows = [
            ...selectedHomePlayers.map((playerId, playerIndex) => ({
              matchId: match.id,
              playerId,
              goals: playerIndex === 0 ? Math.max(homeScore - 1, 0) : Math.min(homeScore, 1),
            })),
            ...selectedAwayPlayers.map((playerId, playerIndex) => ({
              matchId: match.id,
              playerId,
              goals: playerIndex === 0 ? Math.max(awayScore - 1, 0) : Math.min(awayScore, 1),
            })),
          ];

          if (matchPlayerRows.length > 0) {
            await models.MatchPlayer.bulkCreate(matchPlayerRows, { transaction });
          }
        }
      }

      for (const standingRow of createdStandings) {
        const values = standings[standingRow.teamId];
        await standingRow.update(values, { transaction });
      }
    }

    await transaction.commit();

    console.log("Fake data loaded successfully.");
    console.log("Admins: admin1@babyfoot.dev / AdminPass123!, admin2@babyfoot.dev / AdminPass123!");
    console.log("Players password: PlayerPass123!");
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

void seedDatabase()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Database seed failed", error);
    await sequelize.close();
    process.exit(1);
  });

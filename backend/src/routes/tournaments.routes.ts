import { Router } from "express";
import {
  createTournament,
  deleteTournament,
  getTournamentById,
  listTournamentTeams,
  listTournaments,
  registerTournamentTeam,
  removeTournamentTeam,
  scheduleRoundRobin,
  updateTournament,
} from "../controllers/tournaments.controller";
import { getTournamentLeaderboard } from "../controllers/leaderboards.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { tournamentLeaderboardQuerySchema } from "../validators/leaderboards.schema";
import { scheduleRoundRobinSchema } from "../validators/scheduling.schema";
import {
  registerTournamentTeamSchema,
  tournamentTeamParamSchema,
} from "../validators/tournamentTeams.schema";
import {
  createTournamentSchema,
  listTournamentsQuerySchema,
  tournamentIdParamSchema,
  updateTournamentSchema,
} from "../validators/tournaments.schema";

const tournamentsRouter = Router();

tournamentsRouter.get("/", validateRequest({ query: listTournamentsQuerySchema }), asyncHandler(listTournaments));
tournamentsRouter.get(
  "/:id",
  validateRequest({ params: tournamentIdParamSchema }),
  asyncHandler(getTournamentById)
);

tournamentsRouter.get(
  "/:id/teams",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ params: tournamentIdParamSchema }),
  asyncHandler(listTournamentTeams)
);

tournamentsRouter.post(
  "/:id/teams",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ params: tournamentIdParamSchema, body: registerTournamentTeamSchema }),
  asyncHandler(registerTournamentTeam)
);

tournamentsRouter.delete(
  "/:id/teams/:teamId",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: tournamentTeamParamSchema }),
  asyncHandler(removeTournamentTeam)
);

tournamentsRouter.post(
  "/:id/schedule/round-robin",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: tournamentIdParamSchema, body: scheduleRoundRobinSchema }),
  asyncHandler(scheduleRoundRobin)
);

tournamentsRouter.get(
  "/:id/leaderboard",
  validateRequest({ params: tournamentIdParamSchema, query: tournamentLeaderboardQuerySchema }),
  asyncHandler(getTournamentLeaderboard)
);

tournamentsRouter.post(
  "/",
  authenticate,
  authorize(["admin"]),
  validateRequest({ body: createTournamentSchema }),
  asyncHandler(createTournament)
);

tournamentsRouter.patch(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: tournamentIdParamSchema, body: updateTournamentSchema }),
  asyncHandler(updateTournament)
);

tournamentsRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: tournamentIdParamSchema }),
  asyncHandler(deleteTournament)
);

export default tournamentsRouter;

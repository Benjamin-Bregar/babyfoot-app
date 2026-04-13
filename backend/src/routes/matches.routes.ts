import { Router } from "express";
import {
  createMatchPlayer,
  createMatch,
  deleteMatchPlayer,
  deleteMatch,
  getMatchById,
  listMatchPlayers,
  listMatches,
  patchMatchScore,
  updateMatchPlayer,
  updateMatch,
} from "../controllers/matches.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createMatchPlayerSchema,
  matchPlayerCreateParamSchema,
  matchPlayerParamSchema,
  updateMatchPlayerSchema,
} from "../validators/matchPlayers.schema";
import {
  createMatchSchema,
  listMatchesQuerySchema,
  matchIdParamSchema,
  matchScoreSchema,
  updateMatchSchema,
} from "../validators/matches.schema";

const matchesRouter = Router();

matchesRouter.get(
  "/",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ query: listMatchesQuerySchema }),
  asyncHandler(listMatches)
);

matchesRouter.get(
  "/:id",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ params: matchIdParamSchema }),
  asyncHandler(getMatchById)
);

matchesRouter.post(
  "/",
  authenticate,
  authorize(["admin"]),
  validateRequest({ body: createMatchSchema }),
  asyncHandler(createMatch)
);

matchesRouter.patch(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: matchIdParamSchema, body: updateMatchSchema }),
  asyncHandler(updateMatch)
);

matchesRouter.patch(
  "/:id/score",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: matchIdParamSchema, body: matchScoreSchema }),
  asyncHandler(patchMatchScore)
);

matchesRouter.get(
  "/:id/players",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ params: matchPlayerCreateParamSchema }),
  asyncHandler(listMatchPlayers)
);

matchesRouter.post(
  "/:id/players",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: matchPlayerCreateParamSchema, body: createMatchPlayerSchema }),
  asyncHandler(createMatchPlayer)
);

matchesRouter.patch(
  "/:id/players/:playerId",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: matchPlayerParamSchema, body: updateMatchPlayerSchema }),
  asyncHandler(updateMatchPlayer)
);

matchesRouter.delete(
  "/:id/players/:playerId",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: matchPlayerParamSchema }),
  asyncHandler(deleteMatchPlayer)
);

matchesRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: matchIdParamSchema }),
  asyncHandler(deleteMatch)
);

export default matchesRouter;

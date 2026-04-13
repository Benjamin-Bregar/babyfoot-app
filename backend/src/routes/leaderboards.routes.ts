import { Router } from "express";
import { getGlobalPlayerLeaderboard } from "../controllers/leaderboards.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { globalPlayerLeaderboardQuerySchema } from "../validators/leaderboards.schema";

const leaderboardsRouter = Router();

leaderboardsRouter.get(
  "/players/global",
  validateRequest({ query: globalPlayerLeaderboardQuerySchema }),
  asyncHandler(getGlobalPlayerLeaderboard)
);

export default leaderboardsRouter;

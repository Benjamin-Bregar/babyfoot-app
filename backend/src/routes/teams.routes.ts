import { Router } from "express";
import {
  createTeam,
  deleteTeam,
  getTeamById,
  listTeams,
  updateTeam,
} from "../controllers/teams.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createTeamSchema,
  listTeamsQuerySchema,
  teamIdParamSchema,
  updateTeamSchema,
} from "../validators/teams.schema";

const teamsRouter = Router();

teamsRouter.get(
  "/",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ query: listTeamsQuerySchema }),
  asyncHandler(listTeams)
);

teamsRouter.get(
  "/:id",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ params: teamIdParamSchema }),
  asyncHandler(getTeamById)
);

teamsRouter.post(
  "/",
  authenticate,
  authorize(["admin"]),
  validateRequest({ body: createTeamSchema }),
  asyncHandler(createTeam)
);

teamsRouter.patch(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: teamIdParamSchema, body: updateTeamSchema }),
  asyncHandler(updateTeam)
);

teamsRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: teamIdParamSchema }),
  asyncHandler(deleteTeam)
);

export default teamsRouter;

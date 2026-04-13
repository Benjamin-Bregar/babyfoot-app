import { Router } from "express";
import authRouter from "./auth.routes";
import leaderboardsRouter from "./leaderboards.routes";
import matchesRouter from "./matches.routes";
import teamsRouter from "./teams.routes";
import tournamentsRouter from "./tournaments.routes";
import usersRouter from "./users.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/teams", teamsRouter);
apiRouter.use("/tournaments", tournamentsRouter);
apiRouter.use("/matches", matchesRouter);
apiRouter.use("/leaderboards", leaderboardsRouter);

export default apiRouter;

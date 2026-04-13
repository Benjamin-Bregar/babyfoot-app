import Joi from "joi";
import { idParamSchema, paginationQuerySchema } from "./common.schema";

export const leaderboardTournamentIdParamSchema = idParamSchema;

export const tournamentLeaderboardQuerySchema = Joi.object({
  sort: Joi.string().valid("points", "won", "drawn", "lost", "played").default("points"),
  order: Joi.string().valid("asc", "desc").default("desc"),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const globalPlayerLeaderboardQuerySchema = paginationQuerySchema.keys({
  sort: Joi.string().valid("goals", "appearances").default("goals"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});

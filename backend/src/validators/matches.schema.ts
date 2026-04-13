import Joi from "joi";
import { idParamSchema, matchStatusSchema, paginationQuerySchema } from "./common.schema";

export const matchIdParamSchema = idParamSchema;

export const listMatchesQuerySchema = paginationQuerySchema.keys({
  tournamentId: Joi.number().integer().positive().optional(),
  status: matchStatusSchema.optional(),
});

export const createMatchSchema = Joi.object({
  tournamentId: Joi.number().integer().positive().required(),
  matchDate: Joi.date().iso().allow(null),
  round: Joi.string().trim().max(50).allow(null, ""),
  status: matchStatusSchema.default("scheduled"),
  teamIds: Joi.array().items(Joi.number().integer().positive()).length(2).optional(),
});

export const updateMatchSchema = Joi.object({
  matchDate: Joi.date().iso().allow(null),
  round: Joi.string().trim().max(50).allow(null, ""),
  status: matchStatusSchema,
}).min(1);

export const matchScoreSchema = Joi.object({
  homeTeamId: Joi.number().integer().positive().required(),
  awayTeamId: Joi.number().integer().positive().required(),
  homeScore: Joi.number().integer().min(0).required(),
  awayScore: Joi.number().integer().min(0).required(),
}).custom((value) => {
  if (value.homeTeamId === value.awayTeamId) {
    throw new Error("homeTeamId and awayTeamId must be different");
  }
  return value;
});

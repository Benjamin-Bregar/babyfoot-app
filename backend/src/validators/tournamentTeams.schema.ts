import Joi from "joi";
import { idParamSchema, paginationQuerySchema } from "./common.schema";

export const tournamentIdParamSchema = idParamSchema;

export const tournamentTeamParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  teamId: Joi.number().integer().positive().required(),
});

export const listTournamentTeamsQuerySchema = paginationQuerySchema;

export const registerTournamentTeamSchema = Joi.object({
  teamId: Joi.number().integer().positive().required(),
});

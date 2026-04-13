import Joi from "joi";
import { idParamSchema, paginationQuerySchema } from "./common.schema";

export const teamIdParamSchema = idParamSchema;

export const listTeamsQuerySchema = paginationQuerySchema.keys({
  search: Joi.string().trim().max(100).optional(),
});

export const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

export const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

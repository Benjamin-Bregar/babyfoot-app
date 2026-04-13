import Joi from "joi";
import { idParamSchema, paginationQuerySchema } from "./common.schema";

const tournamentDatesValidator = (value: {
  startDate?: string;
  endDate?: string | null;
}): { startDate?: string; endDate?: string | null } => {
  if (value.endDate && value.startDate && value.endDate < value.startDate) {
    throw new Error("endDate must be greater than or equal to startDate");
  }
  return value;
};

export const tournamentIdParamSchema = idParamSchema;

export const listTournamentsQuerySchema = paginationQuerySchema.keys({
  search: Joi.string().trim().max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

export const createTournamentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().allow(null),
  description: Joi.string().trim().max(2000).allow(null, ""),
}).custom(tournamentDatesValidator);

export const updateTournamentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().allow(null),
  description: Joi.string().trim().max(2000).allow(null, ""),
})
  .min(1)
  .custom(tournamentDatesValidator);

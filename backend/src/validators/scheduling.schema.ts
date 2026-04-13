import Joi from "joi";

export const scheduleRoundRobinSchema = Joi.object({
  startAt: Joi.date().iso().optional(),
  intervalMinutes: Joi.number().integer().min(5).max(1440).default(60),
  roundsLabelPrefix: Joi.string().trim().min(1).max(20).default("Round"),
});

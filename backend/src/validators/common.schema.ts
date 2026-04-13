import Joi from "joi";

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const userRoleSchema = Joi.string().valid("admin", "player");

export const matchStatusSchema = Joi.string().valid(
  "scheduled",
  "in_progress",
  "completed",
  "cancelled"
);

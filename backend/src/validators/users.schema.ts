import Joi from "joi";
import { idParamSchema, paginationQuerySchema, userRoleSchema } from "./common.schema";

export const userIdParamSchema = idParamSchema;

export const listUsersQuerySchema = paginationQuerySchema.keys({
  role: userRoleSchema.optional(),
  teamId: Joi.number().integer().positive().optional(),
  search: Joi.string().trim().max(120).optional(),
});

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(128).required(),
  role: userRoleSchema.required(),
  teamId: Joi.number().integer().positive().allow(null),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  email: Joi.string().email().max(255),
  password: Joi.string().min(8).max(128),
  role: userRoleSchema,
  teamId: Joi.number().integer().positive().allow(null),
}).min(1);

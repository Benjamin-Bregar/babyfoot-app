import Joi from "joi";

export const matchPlayerCreateParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const matchPlayerParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  playerId: Joi.number().integer().positive().required(),
});

export const createMatchPlayerSchema = Joi.object({
  playerId: Joi.number().integer().positive().required(),
  goals: Joi.number().integer().min(0).default(0),
});

export const updateMatchPlayerSchema = Joi.object({
  goals: Joi.number().integer().min(0).required(),
});

import { NextFunction, Request, Response } from "express";
import Joi, { ObjectSchema } from "joi";
import { AppError } from "../utils/appError";

type RequestSchemas = {
  body?: ObjectSchema;
  params?: ObjectSchema;
  query?: ObjectSchema;
};

const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
  convert: true,
};

const formatJoiDetails = (error: Joi.ValidationError): string[] => {
  return error.details.map((detail) => detail.message);
};

export const validateRequest = (schemas: RequestSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.params) {
      const validation = schemas.params.validate(req.params, validationOptions);
      if (validation.error) {
        return next(
          new AppError(
            400,
            "Invalid path parameters",
            "VALIDATION_ERROR",
            formatJoiDetails(validation.error)
          )
        );
      }
      req.params = validation.value as Request["params"];
    }

    if (schemas.query) {
      const validation = schemas.query.validate(req.query, validationOptions);
      if (validation.error) {
        return next(
          new AppError(
            400,
            "Invalid query parameters",
            "VALIDATION_ERROR",
            formatJoiDetails(validation.error)
          )
        );
      }
      req.query = validation.value as Request["query"];
    }

    if (schemas.body) {
      const validation = schemas.body.validate(req.body, validationOptions);
      if (validation.error) {
        return next(
          new AppError(
            400,
            "Invalid request body",
            "VALIDATION_ERROR",
            formatJoiDetails(validation.error)
          )
        );
      }
      req.body = validation.value;
    }

    return next();
  };
};

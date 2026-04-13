import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, registerSchema } from "../validators/auth.schema";

const authRouter = Router();

authRouter.post("/register", validateRequest({ body: registerSchema }), asyncHandler(register));
authRouter.post("/login", validateRequest({ body: loginSchema }), asyncHandler(login));
authRouter.get("/me", authenticate, asyncHandler(me));

export default authRouter;

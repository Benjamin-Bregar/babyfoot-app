import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  listMyTournaments,
  listUsers,
  updateUser,
} from "../controllers/users.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validateRequest } from "../middlewares/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/users.schema";

const usersRouter = Router();

usersRouter.get(
  "/",
  authenticate,
  authorize(["admin"]),
  validateRequest({ query: listUsersQuerySchema }),
  asyncHandler(listUsers)
);

usersRouter.get("/me/tournaments", authenticate, authorize(["player"]), asyncHandler(listMyTournaments));

usersRouter.get(
  "/:id",
  authenticate,
  authorize(["admin", "player"]),
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(getUserById)
);

usersRouter.post(
  "/",
  authenticate,
  authorize(["admin"]),
  validateRequest({ body: createUserSchema }),
  asyncHandler(createUser)
);

usersRouter.patch(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: userIdParamSchema, body: updateUserSchema }),
  asyncHandler(updateUser)
);

usersRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(deleteUser)
);

export default usersRouter;

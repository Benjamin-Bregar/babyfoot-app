import cors from "cors";
import express from "express";
import helmet from "helmet";
import apiRouter from "./routes";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFound";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.app.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
    },
    error: null,
  });
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

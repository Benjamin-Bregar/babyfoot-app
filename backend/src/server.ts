import app from "./app";
import { env } from "./config/env";
import { initializeModels } from "./models";
import { sequelize } from "./services/database";

const startServer = async (): Promise<void> => {
  initializeModels();
  await sequelize.authenticate();

  app.listen(env.app.port, () => {
    console.log(`API started on port ${env.app.port}`);
  });
};

void startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

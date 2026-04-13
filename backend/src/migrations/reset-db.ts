import { env } from "../config/env";
import { initializeModels } from "../models";
import { sequelize } from "../services/database";

const resetDatabase = async (): Promise<void> => {
  if (env.app.nodeEnv === "production") {
    throw new Error("Refusing to run db:reset in production");
  }

  initializeModels();
  await sequelize.authenticate();

  console.log("Resetting database schema...");
  await sequelize.sync({ force: true });
  console.log("Database reset completed.");
};

void resetDatabase()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Database reset failed", error);
    await sequelize.close();
    process.exit(1);
  });

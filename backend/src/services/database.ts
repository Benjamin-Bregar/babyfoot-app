import { Sequelize } from "sequelize";
import { env } from "../config/env";

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "postgres",
  logging: env.db.logSql ? console.log : false,
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: false,
  },
});

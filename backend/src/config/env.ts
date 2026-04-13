import dotenv from "dotenv";

dotenv.config();

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
] as const;

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
}

const parseNumber = (value: string | undefined, fallbackValue: number): number => {
  if (!value) {
    return fallbackValue;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? fallbackValue : parsedValue;
};

const parseBoolean = (value: string | undefined, fallbackValue = false): boolean => {
  if (!value) {
    return fallbackValue;
  }

  return value === "true" || value === "1";
};

const parseCorsOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return ["http://localhost:5173"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const env = {
  app: {
    port: parseNumber(process.env.PORT, 3000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  },
  db: {
    host: process.env.DB_HOST as string,
    port: parseNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    logSql: parseBoolean(process.env.DB_LOG_SQL, false),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET as string,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "24h",
  },
};

import { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
   platform: string;
};

type DBConfig = {
url: string;
migrationConfig: MigrationConfig;
}

type Config = {
    db: DBConfig;
    api: APIConfig
}

export const config: Config = {
    db:{
        url: "postgres://postgres:postgres@localhost:5432/chirpy?sslmode=disable",
        migrationConfig: {
            migrationsFolder: "./src/db/migrations",
        }
    },
    api: {
        fileserverHits: 0,
        dbURL: envOrThrow("DB_URL"),
        platform: envOrThrow("PLATFORM"),
    }
};
import { PrismaClient } from "@prisma/client";

export type AepPrismaClient = PrismaClient;

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL): AepPrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a Prisma client");
  }

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
}

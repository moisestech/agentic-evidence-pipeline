import { createPrismaClient } from "@aep/db";

export function requireDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for the review UI");
  }
  return createPrismaClient(url);
}

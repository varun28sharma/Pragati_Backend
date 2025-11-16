import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { logger } from "./logger";

export const prisma = new PrismaClient({
  datasources: { db: { url: env.databaseUrl } }
});

prisma
  .$connect()
  .then(() => logger.info("Connected to MySQL"))
  .catch((error) => {
    logger.error({ error }, "Failed to connect to MySQL");
    process.exit(1);
  });

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

import { PrismaClient, Prisma } from "@prisma/client"
import logger, { logQuery } from "../utils/logger"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: [
//       { emit: "event", level: "query" },
//       { emit: "event", level: "error" },
//       { emit: "event", level: "info" },
//       { emit: "event", level: "warn" },
//     ],
//   })

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
})

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e: Prisma.QueryEvent) => {
    logQuery(e.query, e.params, e.duration)
  })
}

prisma.$on("error", (e: Prisma.LogEvent) => {
  logger.error("Database Error:", e.message)
})

prisma.$on("info", (e: Prisma.LogEvent) => {
  logger.info("Database Info:", e.message)
})

prisma.$on("warn", (e: Prisma.LogEvent) => {
  logger.warn("Database Warning:", e.message)
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

const gracefulShutdown = async () => {
  logger.info("Disconnecting from database...")
  await prisma.$disconnect()
  logger.info("Database disconnected successfully")
}

process.on("SIGINT", gracefulShutdown)
process.on("SIGTERM", gracefulShutdown)

export default prisma

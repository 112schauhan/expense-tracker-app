import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import routes from "./routes"
import {
  globalErrorHandler,
  handleUncaughtException,
  handleUnhandledRejection,
  notFoundHandler,
} from "./middleware/errorHandler"
import logger, { morganStream } from "./utils/logger"

handleUncaughtException()
handleUnhandledRejection()
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)

const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev"
app.use(morgan(morganFormat, { stream: morganStream }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

app.set("trust proxy", 1)
app.use("/api", routes)

app.use("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  })
})

app.get("/", (req, res) => {
  res.json({
    message: "Expense Tracker API",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "/api/docs",
    },
  })
})

app.use(notFoundHandler)

app.use(globalErrorHandler)

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API base URL: http://localhost:${PORT}/api`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});


const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
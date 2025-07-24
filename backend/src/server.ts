import dotenv from "dotenv"

// Load environment variables first, before anything else
console.log("🔍 Loading environment variables...")
dotenv.config()
console.log("✅ Environment variables loaded")

// Basic error handlers to catch startup issues
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception during startup:', error)
  console.error('Stack:', error.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection during startup:', reason)
  console.error('Promise:', promise)
  process.exit(1)
})

console.log("📦 Importing core modules...")

import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"

console.log("✅ Core modules imported")

// Import with error handling
let routes: any
let logger: any
let morganStream: any
let globalErrorHandler: any
let notFoundHandler: any

try {
  console.log("🛣️ Importing routes...")
  routes = require("./routes").default || require("./routes")
  console.log("✅ Routes imported")
} catch (error) {
  console.error("❌ Failed to import routes:", error)
  console.log("🔄 Creating dummy routes...")
  routes = express.Router()
  routes.get("/test", (req: any, res: any) => {
    res.json({ message: "Routes not configured properly" })
  })
}

try {
  console.log("📝 Importing logger...")
  const loggerModule = require("./utils/logger")
  logger = loggerModule.default || loggerModule
  morganStream = loggerModule.morganStream
  console.log("✅ Logger imported")
} catch (error) {
  console.error("❌ Failed to import logger:", error)
  console.log("🔄 Using fallback logger...")
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  }
  morganStream = {
    write: (message: string) => console.log(message.trim())
  }
}

try {
  console.log("🛡️ Importing error handlers...")
  const errorHandlerModule = require("./middleware/errorHandler")
  globalErrorHandler = errorHandlerModule.globalErrorHandler
  notFoundHandler = errorHandlerModule.notFoundHandler
  
  // Set up global error handlers if they exist
  if (errorHandlerModule.handleUncaughtException) {
    errorHandlerModule.handleUncaughtException()
  }
  if (errorHandlerModule.handleUnhandledRejection) {
    errorHandlerModule.handleUnhandledRejection()
  }
  
  console.log("✅ Error handlers imported")
} catch (error) {
  console.error("❌ Failed to import error handlers:", error)
  console.log("🔄 Using fallback error handlers...")
  
  globalErrorHandler = (err: any, req: any, res: any, next: any) => {
    console.error('Global Error:', err)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
  
  notFoundHandler = (req: any, res: any) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`
    })
  }
}

console.log("🚀 Initializing Express app...")

const app = express()
const PORT = process.env.PORT || 3000

console.log("🔒 Setting up security middleware...")
try {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  )
  console.log("✅ Helmet configured")
} catch (error) {
  console.error("❌ Helmet setup failed:", error)
}

console.log("🌐 Setting up CORS...")
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://expense-tracker-app-le5e.vercel.app",
    "https://expense-tracker-app-production-07bb.up.railway.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-Forwarded-For",
    "X-Real-IP"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
}

app.use(cors(corsOptions))
app.set("trust proxy", true)
console.log("✅ CORS configured")

console.log("📊 Setting up logging...")
try {
  const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev"
  app.use(morgan(morganFormat, { stream: morganStream }))
  console.log("✅ Morgan logging configured")
} catch (error) {
  console.error("❌ Morgan setup failed:", error)
}

console.log("📡 Setting up body parsing...")
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

console.log("🏥 Setting up health check...")
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    nodeVersion: process.version,
  })
})

console.log("🏠 Setting up root endpoint...")
app.get("/", (req, res) => {
  res.status(200).json({
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

console.log("🛣️ Setting up API routes...")
app.use("/api", routes)

console.log("🔧 Setting up error handling...")
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  })
})

app.use(notFoundHandler)
app.use(globalErrorHandler)

console.log("🚀 Starting server...")
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`🔗 API base URL: http://localhost:${PORT}/api`)
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  logger.info(`✅ Server startup completed successfully`)
})

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`)

  server.close(() => {
    logger.info("HTTP server closed")
    process.exit(0)
  })

  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down")
    process.exit(1)
  }, 30000)
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

export default app
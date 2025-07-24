import { Request, Response, NextFunction } from "express"
import { Prisma } from "@prisma/client"
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken"
import { logger } from "../utils/logger"

export interface AppError extends Error {
  statusCode: number
  isOperational: boolean
}

export class CustomError extends Error implements AppError {
  statusCode: number
  isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError
): AppError => {
  let message = "Database error occurred"
  let statusCode = 500

  switch (error.code) {
    case "P2002":
      const target = error.meta?.target as string[] | undefined
      const field = target?.[0] || "field"
      message = `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } already exists`
      statusCode = 400
      break

    case "P2025":
      message = "Record not found"
      statusCode = 404
      break

    case "P2003":
      message = "Related record not found"
      statusCode = 400
      break

    case "P2014":
      message = "Invalid relation data provided"
      statusCode = 400
      break

    default:
      message = "Database operation failed"
      statusCode = 500
  }

  return new CustomError(message, statusCode)
}

const handleJWTError = (
  error: JsonWebTokenError | TokenExpiredError
): AppError => {
  if (error instanceof TokenExpiredError) {
    return new CustomError("Token has expired", 401)
  }
  return new CustomError("Invalid token", 401)
}

const handleValidationError = (error: any): AppError => {
  if (error.details) {
    const message = error.details
      .map((detail: any) => detail.message)
      .join(", ")
    return new CustomError(`Validation error: ${message}`, 400)
  }
  return new CustomError("Validation failed", 400)
}

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
    },
  })
}

const sendErrorProd = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  } else {
    logger.error("ERROR:", err)

    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    })
  }
}

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res)
  } else {
    let error = { ...err }
    error.message = err.message

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error = handlePrismaError(err)
    } else if (
      err instanceof JsonWebTokenError ||
      err instanceof TokenExpiredError
    ) {
      error = handleJWTError(err)
    } else if (err.name === "ValidationError") {
      error = handleValidationError(err)
    } else if (err.name === "CastError") {
      error = new CustomError("Invalid data format", 400)
    }

    sendErrorProd(error, res)
  }
}

export const handleUnhandledRejection = (): void => {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason)
    process.exit(1)
  })
}

export const handleUncaughtException = (): void => {
  process.on("uncaughtException", (err: Error) => {
    logger.error("Uncaught Exception:", err.name, err.message)
    logger.error("Stack:", err.stack)
    process.exit(1)
  })
}

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const err = new CustomError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  )
  next(err)
}

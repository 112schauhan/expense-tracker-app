export class ErrorHandler {
  static handleApiError(error: unknown): string {
    if (error instanceof Error) {
      // Check for specific error types
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        return "Authentication failed. Please log in again."
      }

      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        return "You don't have permission to perform this action."
      }

      if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        return "The requested resource was not found."
      }

      if (
        error.message.includes("500") ||
        error.message.includes("Internal Server Error")
      ) {
        return "Server error occurred. Please try again later."
      }

      if (
        error.message.includes("400") ||
        error.message.includes("Bad Request")
      ) {
        return "Invalid request. Please check your input and try again."
      }

      if (
        error.message.includes("Network Error") ||
        error.message.includes("fetch")
      ) {
        return "Network error. Please check your connection and try again."
      }

      return error.message
    }

    if (typeof error === "string") {
      return error
    }

    return "An unexpected error occurred"
  }

  static handleNetworkError(): string {
    return "Network error. Please check your connection and try again."
  }

  static handleValidationErrors(errors: string[]): string {
    if (errors.length === 1) {
      return errors[0]
    }
    return errors.join(", ")
  }

  static handleAuthError(): string {
    return "Authentication failed. Please log in again."
  }

  static handlePermissionError(): string {
    return "You don't have permission to perform this action."
  }

  static handleServerError(): string {
    return "Server error occurred. Please try again later."
  }

  static handleNotFoundError(): string {
    return "The requested resource was not found."
  }

  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes("Network Error") ||
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      )
    }
    return false
  }

  static isAuthError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes("401") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("Authentication")
      )
    }
    return false
  }

  static logError(error: unknown, context?: string): void {
    console.error(`Error${context ? ` in ${context}` : ""}:`, error)
  }
}

// import { Request, Response, NextFunction } from 'express';
// import { Prisma } from '@prisma/client';
// import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
// import { logger } from '../utils/logger';

// export interface AppError extends Error {
//   statusCode: number;
//   isOperational: boolean;
// }

// export class CustomError extends Error implements AppError {
//   statusCode: number;
//   isOperational: boolean;

//   constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
//     super(message);
//     this.statusCode = statusCode;
//     this.isOperational = isOperational;

//     Error.captureStackTrace(this, this.constructor);
//   }
// }

// const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
//   let message = 'Database error occurred';
//   let statusCode = 500;

//   switch (error.code) {
//     case 'P2002':
//       const target = error.meta?.target as string[] | undefined;
//       const field = target?.[0] || 'field';
//       message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
//       statusCode = 400;
//       break;

//     case 'P2025':
//       // Record not found
//       message = 'Record not found';
//       statusCode = 404;
//       break;

//     case 'P2003':
//       // Foreign key constraint violation
//       message = 'Related record not found';
//       statusCode = 400;
//       break;

//     case 'P2014':
//       // Required relation violation
//       message = 'Invalid relation data provided';
//       statusCode = 400;
//       break;

//     default:
//       message = 'Database operation failed';
//       statusCode = 500;
//   }

//   return new CustomError(message, statusCode);
// };

// // Handle JWT errors
// const handleJWTError = (error: JsonWebTokenError | TokenExpiredError): AppError => {
//   if (error instanceof TokenExpiredError) {
//     return new CustomError('Token has expired', 401);
//   }
//   return new CustomError('Invalid token', 401);
// };

// // Handle validation errors
// const handleValidationError = (error: any): AppError => {
//   if (error.details) {
//     const message = error.details.map((detail: any) => detail.message).join(', ');
//     return new CustomError(`Validation error: ${message}`, 400);
//   }
//   return new CustomError('Validation failed', 400);
// };

// // Development error response
// const sendErrorDev = (err: AppError, res: Response): void => {
//   res.status(err.statusCode).json({
//     success: false,
//     error: {
//       message: err.message,
//       stack: err.stack,
//       statusCode: err.statusCode,
//     },
//   });
// };

// // Production error response
// const sendErrorProd = (err: AppError, res: Response): void => {
//   // Operational errors: send message to client
//   if (err.isOperational) {
//     res.status(err.statusCode).json({
//       success: false,
//       message: err.message,
//     });
//   } else {
//     // Programming errors: don't leak error details
//     logger.error('ERROR:', err);

//     res.status(500).json({
//       success: false,
//       message: 'Something went wrong!',
//     });
//   }
// };

// // Main error handling middleware
// export const globalErrorHandler = (
//   err: any,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   if (process.env.NODE_ENV === 'development') {
//     sendErrorDev(err, res);
//   } else {
//     let error = { ...err };
//     error.message = err.message;

//     // Handle specific error types
//     if (err instanceof Prisma.PrismaClientKnownRequestError) {
//       error = handlePrismaError(err);
//     } else if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
//       error = handleJWTError(err);
//     } else if (err.name === 'ValidationError') {
//       error = handleValidationError(err);
//     } else if (err.name === 'CastError') {
//       error = new CustomError('Invalid data format', 400);
//     }

//     sendErrorProd(error, res);
//   }
// };

// // Handle unhandled promise rejections
// export const handleUnhandledRejection = (): void => {
//   process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
//     logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
//     // Close server & exit process
//     process.exit(1);
//   });
// };

// // Handle uncaught exceptions
// export const handleUncaughtException = (): void => {
//   process.on('uncaughtException', (err: Error) => {
//     logger.error('Uncaught Exception:', err.name, err.message);
//     logger.error('Stack:', err.stack);
//     // Close server & exit process
//     process.exit(1);
//   });
// };

// // Catch async errors
// export const catchAsync = (fn: Function) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     fn(req, res, next).catch(next);
//   };
// };

// export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
//   const err = new CustomError(`Can't find ${req.originalUrl} on this server!`, 404);
//   next(err);
// };

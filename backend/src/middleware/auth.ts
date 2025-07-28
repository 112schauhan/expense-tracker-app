import { Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma"
import { AuthRequest, JWTPayload } from "../types"
import { Role } from "@prisma/client"

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      })
      return
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      })
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured")
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found or token is invalid",
      })
      return
    }

    req.user = { ...user, timezone: user.timezone ?? undefined }
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      })
      return
    }

    console.error("Authentication error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    })
  }
}

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions to access this resource",
      })
      return
    }

    next()
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    next()
    return
  }

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader

    if (!token) {
      next()
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      next()
      return
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (user) {
      req.user = { ...user, timezone: user.timezone ?? undefined }
    }
  } catch (error) {
    console.log("Optional auth failed:", error)
  }

  next()
}

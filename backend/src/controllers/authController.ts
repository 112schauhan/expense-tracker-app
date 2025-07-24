import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt, { SignOptions } from "jsonwebtoken"
import { prisma } from "../lib/prisma"
import {
  AuthRequest,
  LoginCredentials,
  RegisterData,
  JWTPayload,
} from "../types"

const generateToken = (payload: JWTPayload): string => {
  const jwtSecret = process.env.JWT_SECRET
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d"

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured")
  }

  const options: SignOptions = {
    expiresIn: (jwtExpiresIn as SignOptions["expiresIn"]) || "7d",
  }

  return jwt.sign(payload, jwtSecret, options)
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use validated data from validation middleware
    const { email, name, password, role }: RegisterData =
      (req as any).validatedBody || req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
      return
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
        role: role || "EMPLOYEE",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // Generate token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const token = generateToken(tokenPayload)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use validated data from validation middleware
    const { email, password }: LoginCredentials = (req as any).validatedBody || req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
      return
    }

    // Generate token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const token = generateToken(tokenPayload)

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    })
  }
}

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      })
      return
    }

    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      })
      return
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile",
    })
  }
}

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      })
      return
    }

    const { name } = req.validatedBody || req.body

    if (!name || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long",
      })
      return
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while updating profile",
    })
  }
}

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      })
      return
    }

    const { currentPassword, newPassword } = req.validatedBody || req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      })
      return
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      })
      return
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    )

    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
      return
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    })

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while changing password",
    })
  }
}

export const refreshToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      })
      return
    }

    // Generate new token
    const tokenPayload: JWTPayload = {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
    }

    const token = generateToken(tokenPayload)

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token },
    })
  } catch (error) {
    console.error("Refresh token error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while refreshing token",
    })
  }
}

// import { Request, Response } from "express"
// import bcrypt from "bcryptjs"
// import jwt, { SignOptions } from "jsonwebtoken"
// import { prisma } from "../lib/prisma"
// import {
//   AuthRequest,
//   LoginCredentials,
//   RegisterData,
//   JWTPayload,
// } from "../types"
// import { Sign } from "crypto"

// const generateToken = (payload: JWTPayload): string => {
//   const jwtSecret = process.env.JWT_SECRET
//   const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d"

//   if (!jwtSecret) {
//     throw new Error("JWT_SECRET is not configured")
//   }

//   const options: SignOptions = {
//     expiresIn: (jwtExpiresIn as SignOptions["expiresIn"]) || "7d",
//   }

//   return jwt.sign(payload, jwtSecret, options)
// }

// export const register = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, name, password, role }: RegisterData = req.body

//     const existingUser = await prisma.user.findUnique({
//       where: { email: email.toLowerCase() },
//     })

//     if (existingUser) {
//       res.status(400).json({
//         success: false,
//         message: "User with this email already exists",
//       })
//       return
//     }

//     const saltRounds = 12
//     const hashedPassword = await bcrypt.hash(password, saltRounds)

//     const user = await prisma.user.create({
//       data: {
//         email: email.toLowerCase(),
//         name: name.trim(),
//         password: hashedPassword,
//         role: role || "EMPLOYEE",
//       },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         role: true,
//         createdAt: true,
//       },
//     })

//     const tokenPayload: JWTPayload = {
//       userId: user.id,
//       email: user.email,
//       role: user.role,
//     }

//     const token = generateToken(tokenPayload)

//     res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       data: {
//         user,
//         token,
//       },
//     })
//   } catch (error) {
//     console.error("Registration error:", error)
//     res.status(500).json({
//       success: false,
//       message: "Internal server error during registration",
//     })
//   }
// }

// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password }: LoginCredentials = req.body

//     const user = await prisma.user.findUnique({
//       where: { email: email.toLowerCase() },
//     })

//     if (!user) {
//       res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       })
//       return
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password)

//     if (!isPasswordValid) {
//       res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       })
//       return
//     }

//     const tokenPayload: JWTPayload = {
//       userId: user.id,
//       email: user.email,
//       role: user.role,
//     }

//     const token = generateToken(tokenPayload)

//     const userResponse = {
//       id: user.id,
//       email: user.email,
//       name: user.name,
//       role: user.role,
//       createdAt: user.createdAt,
//     }

//     res.json({
//       success: true,
//       message: "Login successful",
//       data: {
//         user: userResponse,
//         token,
//       },
//     })
//   } catch (error) {
//     console.error("Login error:", error)
//     res.status(500).json({
//       success: false,
//       message: "Internal server error during login",
//     })
//   }
// }

// export const getProfile = async (
//   req: AuthRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: "User not authenticated",
//       })
//       return
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true,
//         _count: {
//           select: {
//             expenses: true,
//           },
//         },
//       },
//     })

//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: "User not found",
//       })
//       return
//     }

//     res.json({
//       success: true,
//       data: user,
//     })
//   } catch (error) {
//     console.error("Get profile error:", error)
//     res.status(500).json({
//       success: false,
//       message: "Internal server error while fetching profile",
//     })
//   }
// }

// export const updateProfile = async (
//   req: AuthRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: "User not authenticated",
//       })
//       return
//     }

//     const { name } = req.body

//     if (!name || name.trim().length < 2) {
//       res.status(400).json({
//         success: false,
//         message: "Name must be at least 2 characters long",
//       })
//       return
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: req.user.id },
//       data: { name: name.trim() },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     })

//     res.json({
//       success: true,
//       message: "Profile updated successfully",
//       data: updatedUser,
//     })
//   } catch (error) {
//     console.error("Update profile error:", error)
//     res.status(500).json({
//       success: false,
//       message: "Internal server error while updating profile",
//     })
//   }
// }

// export const changePassword = async (
//   req: AuthRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: "User not authenticated",
//       })
//       return
//     }

//     const { currentPassword, newPassword } = req.body

//     if (!currentPassword || !newPassword) {
//       res.status(400).json({
//         success: false,
//         message: "Current password and new password are required",
//       })
//       return
//     }

//     if (newPassword.length < 6) {
//       res.status(400).json({
//         success: false,
//         message: "New password must be at least 6 characters long",
//       })
//       return
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//     })

//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: "User not found",
//       })
//       return
//     }

//     const isCurrentPasswordValid = await bcrypt.compare(
//       currentPassword,
//       user.password
//     )

//     if (!isCurrentPasswordValid) {
//       res.status(400).json({
//         success: false,
//         message: "Current password is incorrect",
//       })
//       return
//     }

//     const saltRounds = 12
//     const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

//     await prisma.user.update({
//       where: { id: req.user.id },
//       data: { password: hashedNewPassword },
//     })

//     res.json({
//       success: true,
//       message: "Password changed successfully",
//     })
//   } catch (error) {
//     console.error("Change password error:", error)
//     res.status(500).json({
//       success: false,
//       message: "Internal server error while changing password",
//     })
//   }
// }

// export const refreshToken = async (
//   req: AuthRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: "User not authenticated",
//       })
//       return
//     }

//     const tokenPayload: JWTPayload = {
//       userId: req.user.id,
//       email: req.user.email,
//       role: req.user.role,
//     }

//     const token = generateToken(tokenPayload)

//     res.json({
//       success: true,
//       message: "Token refreshed successfully",
//       data: { token },
//     })
//   } catch (error) {
//     console.error("Refresh token error:", error)
//     res.status(500).json({
//       success: false,
//       message: "Internal server error while refreshing token",
//     })
//   }
// }

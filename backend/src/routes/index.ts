import express from "express"
import rateLimit from "express-rate-limit"
import { authenticate, authorize } from "../middleware/auth"
import { validate, validateQuery } from "../lib/validation"
import {
  loginSchema,
  registerSchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseApprovalSchema,
  expenseFiltersSchema,
  analyticsFiltersSchema,
} from "../lib/validation"

import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
} from "../controllers/authController"

import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveRejectExpense,
  getExpenseAnalytics,
} from "../controllers/expenseController"

import { Role } from "@prisma/client"

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

router.use(generalLimiter)

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  })
})

router.post("/auth/register", authLimiter, validate(registerSchema), register)
router.post("/auth/login", authLimiter, validate(loginSchema), login)
router.get("/auth/profile", authenticate, getProfile)
router.put("/auth/profile", authenticate, updateProfile)
router.post("/auth/change-password", authenticate, changePassword)
router.post("/auth/refresh-token", authenticate, refreshToken)

router.post(
  '/expenses',
  authenticate,
  validate(createExpenseSchema),
  createExpense
);

router.get(
  '/expenses',
  authenticate,
  validateQuery(expenseFiltersSchema),
  getExpenses
);

router.get('/expenses/:id', authenticate, getExpenseById);

router.put(
  '/expenses/:id',
  authenticate,
  validate(updateExpenseSchema),
  updateExpense
);

router.delete('/expenses/:id', authenticate, deleteExpense);

router.put(
  '/expenses/:id/approve-reject',
  authenticate,
  authorize(Role.ADMIN),
  validate(expenseApprovalSchema),
  approveRejectExpense
);

router.get(
  '/analytics/expenses',
  authenticate,
  validateQuery(analyticsFiltersSchema),
  getExpenseAnalytics
);

router.get(
  '/admin/expenses',
  authenticate,
  authorize(Role.ADMIN),
  validateQuery(expenseFiltersSchema),
  getExpenses
);

router.get(
  '/admin/analytics',
  authenticate,
  authorize(Role.ADMIN),
  validateQuery(analyticsFiltersSchema),
  getExpenseAnalytics
);

export default router;
import express from "express"
import { login } from "../controllers/authController"
import {
  createExpense,
  getExpenses,
  approveRejectExpense,
  getAnalytics,
} from "../controllers/expenseController"
import { authenticateToken, requireAdmin } from "../middleware/auth"

const router = express.Router()

router.post("/auth/login", login)

router.post("/expenses", authenticateToken, createExpense)
router.get("/expenses", authenticateToken, getExpenses)
router.patch(
  "/expenses/:id/status",
  authenticateToken,
  requireAdmin,
  approveRejectExpense
)
router.get("/analytics", authenticateToken, requireAdmin, getAnalytics)

export default router
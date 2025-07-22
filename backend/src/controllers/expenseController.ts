import { Response } from "express"
import { PrismaClient } from "@prisma/client"
import { validateExpense } from "../utils/validation"

const prisma = new PrismaClient()

export const createExpense = async (req: any, res: Response) => {
  try {
    const { amount, category, description, date } = req.body

    const errors = validateExpense(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ errors })
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category: category.trim(),
        description: description.trim(),
        date: new Date(date),
        userId: req.user.id,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    const formattedExpense = {
      ...expense,
      amount: parseFloat(expense.amount.toString()),
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    }

    res.status(201).json(formattedExpense)
  } catch (error) {
    console.error("Create expense error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getExpenses = async (req: any, res: Response) => {
  try {
    const { category, startDate, endDate, status } = req.query
    const isAdmin = req.user.role === "ADMIN"

    const whereClause: any = {}

    if (!isAdmin) {
      whereClause.userId = req.user.id
    }

    if (category) whereClause.category = category
    if (status) whereClause.status = status
    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        const start = new Date(startDate as string)
        start.setHours(0, 0, 0, 0)
        whereClause.date.gte = start
      }
      if (endDate) {
        const end = new Date(endDate as string)
        end.setHours(23, 59, 59, 999)
        whereClause.date.lte = end
      }
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedExpenses = expenses.map((expense) => ({
      ...expense,
      amount: parseFloat(expense.amount.toString()),
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    }))

    res.json(formattedExpenses)
  } catch (error) {
    console.error("Get expenses error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const approveRejectExpense = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be APPROVED or REJECTED" })
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    res.json(expense)
  } catch (error) {
    console.error("Approve/reject expense error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getAnalytics = async (req: any, res: Response) => {
  try {
    const expensesByCategory = await prisma.expense.groupBy({
      by: ["category"],
      where: { status: "APPROVED" },
      _sum: { amount: true },
      _count: { id: true },
    })

    const monthlyExpenses = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses 
      WHERE status = 'APPROVED'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `

    const statusSummary = await prisma.expense.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { id: true },
    })

    res.json({
      categoryBreakdown: expensesByCategory,
      monthlyTrends: monthlyExpenses,
      statusSummary,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

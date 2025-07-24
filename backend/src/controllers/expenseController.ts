import { Response } from "express"
import { prisma } from "../lib/prisma"
import {
  AuthRequest,
  CreateExpenseData,
  UpdateExpenseData,
  ExpenseFilters,
  ExpenseApprovalData,
  PaginatedResponse,
  ExpenseAnalytics,
  CategoryAnalytics,
  StatusAnalytics,
  MonthlyAnalytics,
} from "../types"
import { ExpenseStatus, Role } from "@prisma/client"
import { parse } from "path"

export const createExpense = async (
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

    const {
      amount,
      category,
      description,
      date,
      receiptUrl,
    }: CreateExpenseData = req.body

    const expense = await prisma.expense.create({
      data: {
        amount,
        category,
        description: description || null,
        date: new Date(date),
        receiptUrl: receiptUrl || null,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    })
  } catch (error) {
    console.error("Create expense error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while creating expense",
    })
  }
}

export const getExpenses = async (
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

    const {
      status,
      category,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    }: ExpenseFilters = req.query as any

    // Build where clause
    const where: any = {}

    // Role-based filtering
    if (req.user.role === Role.EMPLOYEE) {
      where.userId = req.user.id
    } else if (userId) {
      where.userId = userId
    }

    // Apply filters
    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const take = limit

    // Get total count
    const total = await prisma.expense.count({ where })

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: parseInt(take.toString()),
    })

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<(typeof expenses)[0]> = {
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error("Get expenses error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching expenses",
    })
  }
}

export const getExpenseById = async (
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

    const { id } = req.params

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!expense) {
      res.status(404).json({
        success: false,
        message: "Expense not found",
      })
      return
    }

    // Check authorization
    if (req.user.role === Role.EMPLOYEE && expense.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You can only view your own expenses",
      })
      return
    }

    res.json({
      success: true,
      data: expense,
    })
  } catch (error) {
    console.error("Get expense by ID error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching expense",
    })
  }
}

export const updateExpense = async (
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

    const { id } = req.params
    const updateData: UpdateExpenseData = req.body

    // Find existing expense
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      res.status(404).json({
        success: false,
        message: "Expense not found",
      })
      return
    }

    // Check authorization
    if (existingExpense.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You can only update your own expenses",
      })
      return
    }

    // Check if expense can be updated (only pending expenses)
    if (existingExpense.status !== ExpenseStatus.PENDING) {
      res.status(400).json({
        success: false,
        message: "Only pending expenses can be updated",
      })
      return
    }

    // Prepare update data
    const dataToUpdate: any = {}

    if (updateData.amount !== undefined) dataToUpdate.amount = updateData.amount
    if (updateData.category !== undefined)
      dataToUpdate.category = updateData.category
    if (updateData.description !== undefined)
      dataToUpdate.description = updateData.description || null
    if (updateData.date !== undefined)
      dataToUpdate.date = new Date(updateData.date)
    if (updateData.receiptUrl !== undefined)
      dataToUpdate.receiptUrl = updateData.receiptUrl || null

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    res.json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    })
  } catch (error) {
    console.error("Update expense error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while updating expense",
    })
  }
}

export const deleteExpense = async (
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

    const { id } = req.params

    // Find existing expense
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      res.status(404).json({
        success: false,
        message: "Expense not found",
      })
      return
    }

    // Check authorization
    if (existingExpense.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You can only delete your own expenses",
      })
      return
    }

    // Check if expense can be deleted (only pending expenses)
    if (existingExpense.status !== ExpenseStatus.PENDING) {
      res.status(400).json({
        success: false,
        message: "Only pending expenses can be deleted",
      })
      return
    }

    await prisma.expense.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Expense deleted successfully",
    })
  } catch (error) {
    console.error("Delete expense error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting expense",
    })
  }
}

export const approveRejectExpense = async (
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

    const { id } = req.params
    const { status, rejectionReason }: ExpenseApprovalData = req.body

    // Find existing expense
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!existingExpense) {
      res.status(404).json({
        success: false,
        message: "Expense not found",
      })
      return
    }

    // Check if expense is still pending
    if (existingExpense.status !== ExpenseStatus.PENDING) {
      res.status(400).json({
        success: false,
        message: "Expense has already been processed",
      })
      return
    }

    // Update expense status
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status,
        rejectionReason:
          status === ExpenseStatus.REJECTED ? rejectionReason : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    res.json({
      success: true,
      message: `Expense ${status.toLowerCase()} successfully`,
      data: updatedExpense,
    })
  } catch (error) {
    console.error("Approve/reject expense error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while processing expense",
    })
  }
}

export const getExpenseAnalytics = async (
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

    const { dateFrom, dateTo, userId } = req.query as any

    // Build where clause
    const where: any = {}

    // Role-based filtering
    if (req.user.role === Role.EMPLOYEE) {
      where.userId = req.user.id
    } else if (userId) {
      where.userId = userId
    }

    // Date filtering
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    // Get total expenses and amount
    const totalStats = await prisma.expense.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true },
    })

    // Get expenses by category
    const categoryStats = await prisma.expense.groupBy({
      by: ["category"],
      where,
      _count: { id: true },
      _sum: { amount: true },
    })

    // Get expenses by status
    const statusStats = await prisma.expense.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
      _sum: { amount: true },
    })

    // Get monthly statistics
    let monthlyStats: any[] = []
    try {
      // Get all expenses for the date range and group them manually
      const expensesForMonthly = await prisma.expense.findMany({
        where,
        select: {
          date: true,
          amount: true,
        },
        orderBy: {
          date: "desc",
        },
      })

      // Group by month manually
      const monthlyMap = new Map<
        string,
        { count: number; totalAmount: number }
      >()

      expensesForMonthly.forEach((expense) => {
        const monthKey = expense.date.toISOString().substring(0, 7) // YYYY-MM format
        const existing = monthlyMap.get(monthKey) || {
          count: 0,
          totalAmount: 0,
        }
        monthlyMap.set(monthKey, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount + expense.amount,
        })
      })

      // Convert to array and sort by month (latest first)
      monthlyStats = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          count: data.count,
          totalAmount: data.totalAmount,
        }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12) // Limit to last 12 months
    } catch (error) {
      console.error("Monthly stats processing error:", error)
      // Fallback to empty array if processing fails
      monthlyStats = []
    }
    // Get top expenses
    const topExpenses = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        amount: "desc",
      },
      take: 10,
    })

    // Calculate percentages for categories
    const totalAmount = totalStats._sum.amount || 0
    const categoryAnalytics: CategoryAnalytics[] = categoryStats.map(
      (stat) => ({
        category: stat.category,
        count: stat._count.id,
        totalAmount: stat._sum.amount || 0,
        percentage:
          totalAmount > 0 ? ((stat._sum.amount || 0) / totalAmount) * 100 : 0,
      })
    )

    const statusAnalytics: StatusAnalytics[] = statusStats.map((stat) => ({
      status: stat.status,
      count: stat._count.id,
      totalAmount: stat._sum.amount || 0,
    }))

    const monthlyAnalytics: MonthlyAnalytics[] = monthlyStats.map((stat) => ({
      month: stat.month,
      count: stat.count,
      totalAmount: stat.totalAmount,
    }))

    const analytics: ExpenseAnalytics = {
      totalExpenses: totalStats._count.id,
      totalAmount: totalAmount,
      expensesByCategory: categoryAnalytics,
      expensesByStatus: statusAnalytics,
      expensesByMonth: monthlyAnalytics,
      topExpenses,
    }

    res.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error("Get analytics error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching analytics",
    })
  }
}

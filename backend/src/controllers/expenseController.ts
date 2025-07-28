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
import { DateTime } from "luxon"

// Utility function to convert user's local date to UTC date range
const getUTCDateRange = (localDate: string, timezone: string) => {
  const startOfDay = DateTime.fromISO(localDate, { zone: timezone }).startOf('day')
  const endOfDay = DateTime.fromISO(localDate, { zone: timezone }).endOf('day')
  
  return {
    start: startOfDay.toUTC().toJSDate(),
    end: endOfDay.toUTC().toJSDate()
  }
}

// Utility function to convert date range with timezone context
const getUTCDateRangeForFilters = (dateFrom?: string, dateTo?: string, timezone?: string) => {
  if (!dateFrom && !dateTo) return {}
  
  const userTimezone = timezone || 'UTC'
  const dateFilter: any = {}
  
  if (dateFrom) {
    const startOfDay = DateTime.fromISO(dateFrom, { zone: userTimezone }).startOf('day')
    dateFilter.gte = startOfDay.toUTC().toJSDate()
  }
  
  if (dateTo) {
    const endOfDay = DateTime.fromISO(dateTo, { zone: userTimezone }).endOf('day')
    dateFilter.lte = endOfDay.toUTC().toJSDate()
  }
  
  return dateFilter
}

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
      timezone, // New field for user's timezone
    }: CreateExpenseData & { timezone: string } = req.body

    // Validate timezone
    if (!timezone) {
      res.status(400).json({
        success: false,
        message: "Timezone is required",
      })
      return
    }

    // Convert user's local date to UTC while preserving the intended date
    const { start: expenseDate } = getUTCDateRange(date, timezone)

    const expense = await prisma.expense.create({
      data: {
        amount,
        category,
        description: description || null,
        date: expenseDate, // Stored as UTC
        timezone, // Store user's timezone for context
        receiptUrl: receiptUrl || null,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true, // Include user's timezone
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
      timezone, // User's current timezone for filtering
      page = 1,
      limit = 10,
    }: ExpenseFilters & { timezone?: string } = req.query as any

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

    // Timezone-aware date filtering
    if (dateFrom || dateTo) {
      const userTimezone = timezone || req.user.timezone || 'UTC'
      where.date = getUTCDateRangeForFilters(dateFrom, dateTo, userTimezone)
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
            timezone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: parseInt(take.toString()),
    })

    // Add timezone context to each expense for frontend processing
    const expensesWithTimezoneContext = expenses.map(expense => ({
      ...expense,
      timezoneContext: {
        originalTimezone: expense.timezone,
        utcDate: expense.date.toISOString(),
        // Calculate what this date means in different timezones
        displayDates: {
          utc: DateTime.fromJSDate(expense.date).toUTC().toFormat('MMM dd, yyyy'),
          original: DateTime.fromJSDate(expense.date).setZone(expense.timezone ?? 'UTC').toFormat('MMM dd, yyyy'),
          viewer: timezone ? DateTime.fromJSDate(expense.date).setZone(timezone).toFormat('MMM dd, yyyy') : null,
        }
      }
    }))

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<typeof expensesWithTimezoneContext[0]> = {
      data: expensesWithTimezoneContext,
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
    const { timezone } = req.query as { timezone?: string }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
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

    // Add timezone context
    const expenseWithTimezoneContext = {
      ...expense,
      timezoneContext: {
        originalTimezone: expense.timezone,
        utcDate: expense.date.toISOString(),
        displayDates: {
          utc: DateTime.fromJSDate(expense.date).toUTC().toFormat('MMM dd, yyyy HH:mm'),
          original: DateTime.fromJSDate(expense.date).setZone(expense.timezone ?? 'UTC').toFormat('MMM dd, yyyy HH:mm'),
          viewer: timezone ? DateTime.fromJSDate(expense.date).setZone(timezone).toFormat('MMM dd, yyyy HH:mm') : null,
        },
        createdAtContext: {
          utc: DateTime.fromJSDate(expense.createdAt).toUTC().toFormat('MMM dd, yyyy HH:mm'),
          original: DateTime.fromJSDate(expense.createdAt).setZone(expense.timezone ?? 'UTC').toFormat('MMM dd, yyyy HH:mm'),
          viewer: timezone ? DateTime.fromJSDate(expense.createdAt).setZone(timezone).toFormat('MMM dd, yyyy HH:mm') : null,
        }
      }
    }

    res.json({
      success: true,
      data: expenseWithTimezoneContext,
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
    const updateData: UpdateExpenseData & { timezone?: string } = req.body

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
    if (updateData.category !== undefined) dataToUpdate.category = updateData.category
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description || null
    if (updateData.receiptUrl !== undefined) dataToUpdate.receiptUrl = updateData.receiptUrl || null
    
    // Handle date update with timezone
    if (updateData.date !== undefined) {
      const timezone = updateData.timezone || existingExpense.timezone || 'UTC'
      const { start: expenseDate } = getUTCDateRange(updateData.date, timezone)
      dataToUpdate.date = expenseDate
      if (updateData.timezone) {
        dataToUpdate.timezone = updateData.timezone
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
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
            timezone: true,
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
        rejectionReason: status === ExpenseStatus.REJECTED ? rejectionReason : null,
        // Track when and by whom the expense was processed
        processedAt: new Date(),
        processedBy: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
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

    const { dateFrom, dateTo, userId, timezone } = req.query as any

    // Build where clause
    const where: any = {}

    // Role-based filtering
    if (req.user.role === Role.EMPLOYEE) {
      where.userId = req.user.id
    } else if (userId) {
      where.userId = userId
    }

    // Timezone-aware date filtering for analytics
    if (dateFrom || dateTo) {
      const userTimezone = timezone || req.user.timezone || 'UTC'
      where.date = getUTCDateRangeForFilters(dateFrom, dateTo, userTimezone)
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

    // Get monthly statistics with timezone awareness
    let monthlyStats: any[] = []
    try {
      const expensesForMonthly = await prisma.expense.findMany({
        where,
        select: {
          date: true,
          amount: true,
          timezone: true,
        },
        orderBy: {
          date: "desc",
        },
      })

      // Group by month with timezone consideration
      const userTimezone = timezone || req.user.timezone || 'UTC'
      const monthlyMap = new Map<string, { count: number; totalAmount: number }>()

      expensesForMonthly.forEach((expense) => {
        // Convert UTC date to user's timezone for proper monthly grouping
        const expenseInUserTz = DateTime.fromJSDate(expense.date).setZone(userTimezone)
        const monthKey = expenseInUserTz.toFormat('yyyy-MM')
        
        const existing = monthlyMap.get(monthKey) || { count: 0, totalAmount: 0 }
        monthlyMap.set(monthKey, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount + Number(expense.amount),
        })
      })

      // Convert to array and sort by month (latest first)
      monthlyStats = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month: month + '-01',
          count: data.count,
          totalAmount: data.totalAmount,
        }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12) // Limit to last 12 months
    } catch (error) {
      console.error("Monthly stats processing error:", error)
      monthlyStats = []
    }

    // Get top expenses
    const topExpensesRaw = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
          },
        },
      },
      orderBy: {
        amount: "desc",
      },
      take: 10,
    })

    const topExpenses = topExpensesRaw.map(expense => ({
      ...expense,
      timezone: expense.timezone ?? undefined,
      rejectionReason: expense.rejectionReason === null ? undefined : expense.rejectionReason,
      user:{
        ...expense.user,
        timezone: expense.user.timezone ?? undefined,
      }
    }))

    // Calculate percentages for categories
    const totalAmount = Number(totalStats._sum.amount) || 0
    const categoryAnalytics: CategoryAnalytics[] = categoryStats.map((stat) => {
      const statAmount = Number(stat._sum.amount) || 0
      return {
        category: stat.category,
        count: stat._count.id,
        totalAmount: statAmount,
        percentage: totalAmount > 0 ? (statAmount / totalAmount) * 100 : 0,
      }
    })

    const statusAnalytics: StatusAnalytics[] = statusStats.map((stat) => ({
      status: stat.status,
      count: stat._count.id,
      totalAmount: Number(stat._sum.amount) || 0,
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
      topExpenses: topExpenses,
      // Add timezone context for analytics
      timezoneContext: {
        userTimezone: timezone || req.user.timezone || 'UTC',
        generatedAt: new Date().toISOString(),
      }
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
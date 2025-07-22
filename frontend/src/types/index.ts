export interface User {
  id: number
  name: string
  email: string
  role: "EMPLOYEE" | "ADMIN"
}

export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  userId: string
  user: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseData {
  amount: number
  category: string
  description: string
  date: string
}

export interface ExpenseFilters {
  category?: string
  startDate?: string
  endDate?: string
  status?: string
}

export interface AnalyticsData {
  categoryBreakdown: Array<{
    category: string
    _sum: { amount: number }
    _count: { id: number }
  }>
  monthlyTrends: Array<{
    month: string
    total: number
    count: number
  }>
  statusSummary: Array<{
    status: string
    _sum: { amount: number }
    _count: { id: number }
  }>
}
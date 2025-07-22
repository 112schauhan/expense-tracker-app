export interface User {
  id: number
  name: string
  email: string
  role: "EMPLOYEE" | "ADMIN"
  createdAt: Date
  updatedAt: Date
}

export interface AuthRequest extends Request {
  user?: User
}

export interface CreateExpenseRequest {
  amount: number
  category: string
  description?: string
  date: Date
}

export interface ExpenseFilter {
  category?: string
  startDate?: Date
  endDate?: Date
  status?: "PENDING" | "APPROVED" | "REJECTED"
}

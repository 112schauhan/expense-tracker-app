export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Request/Response interfaces
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: "EMPLOYEE" | "ADMIN"
  }
  expiresIn: number
}

export interface RefreshTokenResponse {
  token: string
  expiresIn: number
}

export interface CreateExpenseRequest {
  amount: number
  category: string
  description: string
  date: string // ISO string
}

export interface UpdateExpenseRequest {
  amount?: number
  category?: string
  description?: string
  date?: string // ISO string
}

export interface ExpenseResponse {
  id: string
  amount: string // Decimal as string from backend
  category: string
  description: string
  date: string // ISO string
  status: "PENDING" | "APPROVED" | "REJECTED"
  userId: string
  user: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

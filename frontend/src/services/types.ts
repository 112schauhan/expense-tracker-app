// export interface ApiResponse<T> {
//   data: T
//   message?: string
//   success: boolean
// }

// export interface PaginatedResponse<T> {
//   data: T[]
//   pagination: {
//     page: number
//     limit: number
//     total: number
//     totalPages: number
//     hasNext: boolean
//     hasPrev: boolean
//   }
// }

// // Request/Response interfaces
// export interface LoginRequest {
//   email: string
//   password: string
// }

// export interface LoginResponse {
//   token: string
//   user: {
//     id: string
//     email: string
//     name: string
//     role: "EMPLOYEE" | "ADMIN"
//   }
//   expiresIn: number
// }

// export interface RefreshTokenResponse {
//   token: string
//   expiresIn: number
// }

// export interface CreateExpenseRequest {
//   amount: number
//   category: string
//   description: string
//   date: string // ISO string
// }

// export interface UpdateExpenseRequest {
//   amount?: number
//   category?: string
//   description?: string
//   date?: string // ISO string
// }

// export interface ExpenseResponse {
//   id: string
//   amount: string // Decimal as string from backend
//   category: string
//   description: string
//   date: string // ISO string
//   status: "PENDING" | "APPROVED" | "REJECTED"
//   userId: string
//   user: {
//     name: string
//     email: string
//   }
//   createdAt: string
//   updatedAt: string
// }

// Frontend types for users, expenses, authentication, analytics etc.

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    expenses: number;
  };
}

export type Role = "EMPLOYEE" | "ADMIN";

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description?: string | null;
  date: string;
  status: ExpenseStatus;
  receiptUrl?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  user: Pick<User, "id" | "name" | "email">;
}

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ExpenseCategory =
  | "FOOD"
  | "TRANSPORT"
  | "ACCOMMODATION"
  | "OFFICE_SUPPLIES"
  | "SOFTWARE"
  | "TRAINING"
  | "MARKETING"
  | "TRAVEL"
  | "ENTERTAINMENT"
  | "UTILITIES"
  | "OTHER";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// For creating or updating expenses
export interface CreateExpenseData {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string; // ISO string format
  receiptUrl?: string;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: ExpenseCategory;
  description?: string;
  date?: string;
  receiptUrl?: string;
}

export interface ExpenseApprovalData {
  status: ExpenseStatus; // APPROVED or REJECTED
  rejectionReason?: string;
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CategoryAnalytics {
  category: ExpenseCategory;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface StatusAnalytics {
  status: ExpenseStatus;
  count: number;
  totalAmount: number;
}

export interface MonthlyAnalytics {
  month: string; // format 'YYYY-MM'
  count: number;
  totalAmount: number;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  totalAmount: number;
  expensesByCategory: CategoryAnalytics[];
  expensesByStatus: StatusAnalytics[];
  expensesByMonth: MonthlyAnalytics[];
  topExpenses: Expense[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
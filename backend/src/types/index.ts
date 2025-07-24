import { Request } from 'express';
import { User, Role, ExpenseStatus, ExpenseCategory } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
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

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface CreateExpenseData {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
  receiptUrl?: string;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: ExpenseCategory;
  description?: string;
  date?: string;
  receiptUrl?: string;
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

export interface ExpenseApprovalData {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  totalAmount: number;
  expensesByCategory: CategoryAnalytics[];
  expensesByStatus: StatusAnalytics[];
  expensesByMonth: MonthlyAnalytics[];
  topExpenses: ExpenseWithUser[];
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
  month: string;
  count: number;
  totalAmount: number;
}

export interface ExpenseWithUser {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  date: Date;
  status: ExpenseStatus;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

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

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export { 
  User, 
  Expense, 
  Role, 
  ExpenseStatus, 
  ExpenseCategory 
} from '@prisma/client';
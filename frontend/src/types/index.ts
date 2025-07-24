export type Role = "EMPLOYEE" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

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

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description?: string | null;
  date: string; // ISO string
  status: ExpenseStatus;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string; // ISO string
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  dateFrom?: string; // ISO string
  dateTo?: string; // ISO string
  status?: ExpenseStatus;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsData {
  categoryBreakdown: Array<{
    category: ExpenseCategory;
    _sum: { amount: number };
    _count: { id: number };
  }>;
  monthlyTrends: Array<{
    month: string; // YYYY-MM
    total: number;
    count: number;
  }>;
  statusSummary: Array<{
    status: ExpenseStatus;
    _sum: { amount: number };
    _count: { id: number };
  }>;
}

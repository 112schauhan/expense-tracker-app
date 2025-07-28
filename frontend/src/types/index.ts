export type Role = "EMPLOYEE" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  timezone?: string; // New field for user's default timezone
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
  timezone?: string; // New field for expense timezone context
  status: ExpenseStatus;
  rejectionReason?: string; // New field for rejection reason
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    timezone?: string; // User's timezone
  };
  processedAt?: string; // When expense was approved/rejected
  processedBy?: string; // Who processed the expense
  createdAt: string;
  updatedAt: string;
}

// Timezone Context Interface
export interface TimezoneContext {
  originalTimezone: string;
  utcDate: string;
  displayDates: {
    utc: string;
    original: string;
    viewer: string | null;
  };
  createdAtContext?: {
    utc: string;
    original: string;
    viewer: string | null;
  };
}

// Extended Expense with Timezone Context
export interface ExpenseWithTimezone extends Expense {
  timezoneContext?: TimezoneContext;
}

export interface CreateExpenseData {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string; // ISO string (YYYY-MM-DD)
  timezone: string; // User's timezone when creating the expense
}

export interface UpdateExpenseData {
  amount?: number;
  category?: ExpenseCategory;
  description?: string;
  date?: string; // ISO string (YYYY-MM-DD)
  timezone?: string; // Updated timezone if different
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  dateFrom?: string; // ISO string (YYYY-MM-DD)
  dateTo?: string; // ISO string (YYYY-MM-DD)
  status?: ExpenseStatus;
  userId?: string;
  timezone?: string; // User's timezone for proper date filtering
  page?: number;
  limit?: number;
}

// Approval Data Interface
export interface ExpenseApprovalData {
  status: ExpenseStatus;
  rejectionReason?: string;
}

// Analytics Interfaces with Timezone Awareness
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
  timezoneContext?: {
    userTimezone: string;
    generatedAt: string;
  };
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
  month: string; // ISO month string (YYYY-MM-01)
  count: number;
  totalAmount: number;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  totalAmount: number;
  expensesByCategory: CategoryAnalytics[];
  expensesByStatus: StatusAnalytics[];
  expensesByMonth: MonthlyAnalytics[];
  topExpenses: ExpenseWithTimezone[];
  timezoneContext?: {
    userTimezone: string;
    generatedAt: string;
  };
}

// Pagination Interface
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

// API Response Types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Timezone Utility Types
export interface TimezoneInfo {
  timezone: string;
  offset: string;
  abbreviation: string;
  displayName: string;
}

// User Timezone Preferences
export interface UserTimezonePreferences {
  defaultTimezone: string;
  autoDetect: boolean;
  displayFormat: '12h' | '24h';
  showTimezoneInDates: boolean;
}
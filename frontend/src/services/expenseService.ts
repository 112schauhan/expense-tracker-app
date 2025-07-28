import api from "./api";
import {
  type Expense,
  type CreateExpenseData,
  type UpdateExpenseData,
  type ExpenseFilters,
  type ExpenseApprovalData,
  type PaginatedResponse,
} from "./types";

// Extended interfaces for timezone support
interface CreateExpenseDataWithTimezone extends CreateExpenseData {
  timezone: string;
}

interface ExpenseFiltersWithTimezone extends ExpenseFilters {
  timezone?: string;
}

interface UpdateExpenseDataWithTimezone extends UpdateExpenseData {
  timezone?: string;
}

export const createExpense = async (
  data: CreateExpenseDataWithTimezone
): Promise<{ success: boolean; message: string; data: Expense }> => {
  return api.post("/expenses", data);
};

export const getExpenses = async (
  filters?: ExpenseFiltersWithTimezone
): Promise<{ success: boolean; data: PaginatedResponse<Expense> }> => {
  const query = new URLSearchParams();

  if (filters) {
    if (filters.status) query.append("status", filters.status);
    if (filters.category) query.append("category", filters.category);
    if (filters.userId) query.append("userId", filters.userId);
    if (filters.dateFrom) query.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) query.append("dateTo", filters.dateTo);
    if (filters.timezone) query.append("timezone", filters.timezone); // Include timezone
    if (filters.page !== undefined) query.append("page", String(filters.page));
    if (filters.limit !== undefined) query.append("limit", String(filters.limit));
  }

  const queryString = query.toString();
  return api.get(`/expenses${queryString ? `?${queryString}` : ""}`);
};

export const getExpenseById = async (
  id: string,
  timezone?: string
): Promise<{ success: boolean; data: Expense }> => {
  const params = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
  return api.get(`/expenses/${id}${params}`);
};

export const updateExpense = async (
  id: string,
  data: UpdateExpenseDataWithTimezone
): Promise<{ success: boolean; message: string; data: Expense }> => {
  return api.put(`/expenses/${id}`, data);
};

export const deleteExpense = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  return api.delete(`/expenses/${id}`);
};

export const approveRejectExpense = async (
  id: string,
  data: ExpenseApprovalData
): Promise<{ success: boolean; message: string; data: Expense }> => {
  return api.put(`/expenses/${id}/approve-reject`, data);
};

// New function to get expense analytics with timezone support
export const getExpenseAnalytics = async (params?: {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  timezone?: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<{ success: boolean; data: any }> => {
  const query = new URLSearchParams();

  if (params) {
    if (params.dateFrom) query.append("dateFrom", params.dateFrom);
    if (params.dateTo) query.append("dateTo", params.dateTo);
    if (params.userId) query.append("userId", params.userId);
    if (params.timezone) query.append("timezone", params.timezone);
  }

  const queryString = query.toString();
  return api.get(`/analytics/expenses${queryString ? `?${queryString}` : ""}`);
};
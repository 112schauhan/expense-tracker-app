import api from "./api";
import { type ExpenseAnalytics } from "./types";

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  timezone?: string; // New field for timezone-aware analytics
}

// Enhanced analytics service with timezone support
export const getExpenseAnalytics = async (
  filters?: AnalyticsFilters
): Promise<{ success: boolean; data: ExpenseAnalytics }> => {
  const query = new URLSearchParams();

  if (filters) {
    if (filters.dateFrom) query.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) query.append("dateTo", filters.dateTo);
    if (filters.userId) query.append("userId", filters.userId);
    if (filters.timezone) query.append("timezone", filters.timezone); // Include timezone
  }

  const queryString = query.toString();
  return api.get(`/analytics/expenses${queryString ? `?${queryString}` : ""}`);
};

// Additional analytics functions with timezone awareness

export interface DashboardMetrics {
  totalExpenses: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  monthlyTotal: number;
  averageExpense: number;
  topCategory: string;
  topSpender?: string;
  timezoneContext?: {
    userTimezone: string;
    generatedAt: string;
  };
}

export const getDashboardMetrics = async (
  filters: AnalyticsFilters = {}
): Promise<{ success: boolean; data: DashboardMetrics }> => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value.toString());
    }
  });

  const queryString = query.toString();
  return api.get(`/analytics/dashboard${queryString ? `?${queryString}` : ""}`);
};

export interface ExpenseTrend {
  period: string;
  amount: number;
  count: number;
  timezone?: string;
}

export const getExpenseTrends = async (
  period: "week" | "month" | "quarter" | "year" = "month",
  timezone?: string
): Promise<{ success: boolean; data: ExpenseTrend[] }> => {
  const query = new URLSearchParams();
  query.append("period", period);
  
  if (timezone) {
    query.append("timezone", timezone);
  }

  return api.get(`/analytics/trends?${query.toString()}`);
};

export interface CategoryAnalysis {
  category: string;
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  percentage: number;
}

export const getCategoryAnalysis = async (
  filters: AnalyticsFilters = {}
): Promise<{ success: boolean; data: CategoryAnalysis[] }> => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value.toString());
    }
  });

  const queryString = query.toString();
  return api.get(`/analytics/categories${queryString ? `?${queryString}` : ""}`);
};

export interface TopSpender {
  userId: string;
  userName: string;
  userTimezone?: string;
  totalAmount: number;
  expenseCount: number;
  averageAmount: number;
}

export const getTopSpenders = async (
  limit: number = 10,
  timezone?: string
): Promise<{ success: boolean; data: TopSpender[] }> => {
  const query = new URLSearchParams();
  query.append("limit", limit.toString());
  
  if (timezone) {
    query.append("timezone", timezone);
  }

  return api.get(`/analytics/top-spenders?${query.toString()}`);
};

export interface StatusDistribution {
  pending: { count: number; amount: number };
  approved: { count: number; amount: number };
  rejected: { count: number; amount: number };
}

export const getStatusDistribution = async (
  filters: AnalyticsFilters = {}
): Promise<{ success: boolean; data: StatusDistribution }> => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value.toString());
    }
  });

  const queryString = query.toString();
  return api.get(`/analytics/status${queryString ? `?${queryString}` : ""}`);
};

export const generateReport = async (
  filters: AnalyticsFilters = {},
  format: "pdf" | "csv" | "excel" = "pdf"
): Promise<Blob> => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value.toString());
    }
  });

  query.append("format", format);

  const queryString = query.toString();
  
  // Use fetch directly for blob response
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || '/api'}/analytics/report${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate report");
  }

  return response.blob();
};

// Timezone utility functions
export const getTimezoneOffset = (timezone: string): string => {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    
    const sign = offset >= 0 ? "+" : "-";
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.round((Math.abs(offset) - hours) * 60);
    
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } catch {
    return "+00:00";
  }
};

export const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find(part => part.type === "timeZoneName");
    return timeZonePart?.value || timezone;
  } catch {
    return timezone;
  }
};

export const formatTimezoneDisplay = (timezone: string): string => {
  const offset = getTimezoneOffset(timezone);
  const abbreviation = getTimezoneAbbreviation(timezone);
  return `${timezone} (${abbreviation} ${offset})`;
};
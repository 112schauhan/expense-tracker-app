// import { apiClient } from "./api"
// import { type AnalyticsData } from "../types"

// export interface AnalyticsFilters {
//   startDate?: Date
//   endDate?: Date
//   category?: string
//   userId?: string
// }

// export interface DashboardMetrics {
//   totalExpenses: number
//   totalAmount: number
//   pendingCount: number
//   approvedCount: number
//   rejectedCount: number
//   monthlyTotal: number
//   averageExpense: number
//   topCategory: string
//   topSpender?: string
// }

// class AnalyticsService {
//   /**
//    * Get comprehensive analytics data
//    */
//   async getAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData> {
//     try {
//       const queryParams = new URLSearchParams()

//       Object.entries(filters).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== "") {
//           if (key === "startDate" || key === "endDate") {
//             queryParams.append(key, (value as Date).toISOString())
//           } else {
//             queryParams.append(key, value.toString())
//           }
//         }
//       })

//       const endpoint = `/analytics${
//         queryParams.toString() ? `?${queryParams}` : ""
//       }`
//       const response = await apiClient.get<AnalyticsData>(endpoint)

//       return response
//     } catch (error) {
//       console.error("Get analytics service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Get dashboard metrics
//    */
//   async getDashboardMetrics(
//     filters: AnalyticsFilters = {}
//   ): Promise<DashboardMetrics> {
//     try {
//       const queryParams = new URLSearchParams()

//       Object.entries(filters).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== "") {
//           if (key === "startDate" || key === "endDate") {
//             queryParams.append(key, (value as Date).toISOString())
//           } else {
//             queryParams.append(key, value.toString())
//           }
//         }
//       })

//       const endpoint = `/analytics/dashboard${
//         queryParams.toString() ? `?${queryParams}` : ""
//       }`
//       const response = await apiClient.get<DashboardMetrics>(endpoint)

//       return response
//     } catch (error) {
//       console.error("Get dashboard metrics service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Get expense trends over time
//    */
//   async getExpenseTrends(
//     period: "week" | "month" | "quarter" | "year" = "month"
//   ): Promise<
//     Array<{
//       period: string
//       amount: number
//       count: number
//     }>
//   > {
//     try {
//       const response = await apiClient.get<
//         Array<{
//           period: string
//           amount: number
//           count: number
//         }>
//       >(`/analytics/trends?period=${period}`)

//       return response
//     } catch (error) {
//       console.error("Get expense trends service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Get category spending analysis
//    */
//   async getCategoryAnalysis(filters: AnalyticsFilters = {}): Promise<
//     Array<{
//       category: string
//       totalAmount: number
//       totalCount: number
//       averageAmount: number
//       percentage: number
//     }>
//   > {
//     try {
//       const queryParams = new URLSearchParams()

//       Object.entries(filters).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== "") {
//           if (key === "startDate" || key === "endDate") {
//             queryParams.append(key, (value as Date).toISOString())
//           } else {
//             queryParams.append(key, value.toString())
//           }
//         }
//       })

//       const endpoint = `/analytics/categories${
//         queryParams.toString() ? `?${queryParams}` : ""
//       }`
//       const response = await apiClient.get<
//         Array<{
//           category: string
//           totalAmount: number
//           totalCount: number
//           averageAmount: number
//           percentage: number
//         }>
//       >(endpoint)

//       return response
//     } catch (error) {
//       console.error("Get category analysis service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Get top spenders (admin only)
//    */
//   async getTopSpenders(limit: number = 10): Promise<
//     Array<{
//       userId: string
//       userName: string
//       totalAmount: number
//       expenseCount: number
//       averageAmount: number
//     }>
//   > {
//     try {
//       const response = await apiClient.get<
//         Array<{
//           userId: string
//           userName: string
//           totalAmount: number
//           expenseCount: number
//           averageAmount: number
//         }>
//       >(`/analytics/top-spenders?limit=${limit}`)

//       return response
//     } catch (error) {
//       console.error("Get top spenders service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Get expense status distribution
//    */
//   async getStatusDistribution(filters: AnalyticsFilters = {}): Promise<{
//     pending: { count: number; amount: number }
//     approved: { count: number; amount: number }
//     rejected: { count: number; amount: number }
//   }> {
//     try {
//       const queryParams = new URLSearchParams()

//       Object.entries(filters).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== "") {
//           if (key === "startDate" || key === "endDate") {
//             queryParams.append(key, (value as Date).toISOString())
//           } else {
//             queryParams.append(key, value.toString())
//           }
//         }
//       })

//       const endpoint = `/analytics/status${
//         queryParams.toString() ? `?${queryParams}` : ""
//       }`
//       const response = await apiClient.get<{
//         pending: { count: number; amount: number }
//         approved: { count: number; amount: number }
//         rejected: { count: number; amount: number }
//       }>(endpoint)

//       return response
//     } catch (error) {
//       console.error("Get status distribution service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Generate expense report
//    */
//   async generateReport(
//     filters: AnalyticsFilters = {},
//     format: "pdf" | "csv" | "excel" = "pdf"
//   ): Promise<Blob> {
//     try {
//       const queryParams = new URLSearchParams()

//       Object.entries(filters).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== "") {
//           if (key === "startDate" || key === "endDate") {
//             queryParams.append(key, (value as Date).toISOString())
//           } else {
//             queryParams.append(key, value.toString())
//           }
//         }
//       })

//       queryParams.append("format", format)

//       const endpoint = `/analytics/report${
//         queryParams.toString() ? `?${queryParams}` : ""
//       }`

//       const response = await fetch(`${apiClient["baseURL"]}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       })

//       if (!response.ok) {
//         throw new Error("Failed to generate report")
//       }

//       return response.blob()
//     } catch (error) {
//       console.error("Generate report service error:", error)
//       throw error
//     }
//   }
// }

// export const analyticsService = new AnalyticsService()
import api from "./api";
import { type ExpenseAnalytics } from "./types";

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export const getExpenseAnalytics = async (
  filters?: AnalyticsFilters
): Promise<{ success: boolean; data: ExpenseAnalytics }> => {
  const query = new URLSearchParams();

  if (filters) {
    if (filters.dateFrom) query.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) query.append("dateTo", filters.dateTo);
    if (filters.userId) query.append("userId", filters.userId);
  }

  const queryString = query.toString();
  return api.get(`/analytics/expenses${queryString ? `?${queryString}` : ""}`);
};

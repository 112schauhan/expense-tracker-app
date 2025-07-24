// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { apiClient } from "./api"
// import { type Expense, type CreateExpenseData, type ExpenseFilters } from "../types"

// export interface UpdateExpenseData {
//   amount?: number
//   category?: string
//   description?: string
//   date?: Date
// }

// export interface ExpenseQueryParams extends ExpenseFilters {
//   page?: number
//   limit?: number
//   sortBy?: "date" | "amount" | "category" | "status" | "createdAt"
//   sortOrder?: "asc" | "desc"
// }

// class ExpenseService {
//   /**
//    * Create a new expense
//    */
//   async createExpense(expenseData: CreateExpenseData): Promise<Expense> {
//     try {
//       // Convert Date to ISO string for API
//       const payload = {
//         ...expenseData,
//         date: expenseData.date.toISOString(),
//       }

//       const response = await apiClient.post<unknown>("/expenses", payload)

//       // Convert date strings back to Date objects
//       return this.transformExpenseFromAPI(response)
//     } catch (error) {
//       console.error("Create expense service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Get expenses with optional filtering and pagination
//    */
//   async getExpenses(params: ExpenseQueryParams = {}): Promise<Expense[]> {
//     try {
//       // Build query string
//       const queryParams = new URLSearchParams()

//       Object.entries(params).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== "") {
//           if (key === "startDate" || key === "endDate") {
//             queryParams.append(key, (value as Date).toISOString())
//           } else {
//             queryParams.append(key, value.toString())
//           }
//         }
//       })

//       const endpoint = `/expenses${
//         queryParams.toString() ? `?${queryParams}` : ""
//       }`
//       const response = await apiClient.get<unknown[]>(endpoint)

//       // Transform all expenses
//       return response.map(this.transformExpenseFromAPI)
//     } catch (error) {
//       console.error("Get expenses service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Get a specific expense by ID
//    */
//   async getExpenseById(id: string): Promise<Expense> {
//     try {
//       const response = await apiClient.get<unknown>(`/expenses/${id}`)
//       return this.transformExpenseFromAPI(response)
//     } catch (error) {
//       console.error("Get expense by ID service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Update an existing expense
//    */
//   async updateExpense(
//     id: string,
//     updates: UpdateExpenseData
//   ): Promise<Expense> {
//     try {
//       // Convert Date to ISO string if present
//       const payload = { ...updates }
//       if (payload.date) {
//         payload.date = payload.date.toISOString() as any
//       }

//       const response = await apiClient.put<unknown>(`/expenses/${id}`, payload)
//       return this.transformExpenseFromAPI(response)
//     } catch (error) {
//       console.error("Update expense service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Update expense status (approve/reject)
//    */
//   async updateExpenseStatus(
//     id: string,
//     status: "APPROVED" | "REJECTED" | "PENDING"
//   ): Promise<Expense> {
//     try {
//       const response = await apiClient.patch<any>(`/expenses/${id}/status`, {
//         status,
//       })
//       return this.transformExpenseFromAPI(response)
//     } catch (error) {
//       console.error("Update expense status service error:", error)
//       throw error
//     }
//   }

//   async deleteExpense(id: string): Promise<void> {
//     try {
//       await apiClient.delete(`/expenses/${id}`)
//     } catch (error) {
//       console.error("Delete expense service error:", error)
//       throw error
//     }
//   }
//   async bulkUpdateExpenses(
//     ids: string[],
//     updates: Partial<UpdateExpenseData>
//   ): Promise<Expense[]> {
//     try {
//       const response = await apiClient.patch<any[]>("/expenses/bulk", {
//         ids,
//         updates,
//       })
//       return response.map(this.transformExpenseFromAPI)
//     } catch (error) {
//       console.error("Bulk update expenses service error:", error)
//       throw error
//     }
//   }

//   async getExpenseCategories(): Promise<string[]> {
//     try {
//       const response = await apiClient.get<string[]>("/expenses/categories")
//       return response
//     } catch (error) {
//       console.error("Get expense categories service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Upload expense receipt
//    */
//   async uploadReceipt(
//     expenseId: string,
//     file: File
//   ): Promise<{ receiptUrl: string }> {
//     try {
//       const formData = new FormData()
//       formData.append("receipt", file)

//       const response = await fetch(
//         `${apiClient["baseURL"]}/expenses/${expenseId}/receipt`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: formData,
//         }
//       )

//       if (!response.ok) {
//         throw new Error("Failed to upload receipt")
//       }

//       return response.json()
//     } catch (error) {
//       console.error("Upload receipt service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Export expenses to CSV
//    */
//   async exportExpenses(filters: ExpenseFilters = {}): Promise<Blob> {
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

//       const endpoint = `/expenses/export${
//         queryParams.toString() ? `?${queryParams}` : ""
//       }`

//       const response = await fetch(`${apiClient["baseURL"]}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       })

//       if (!response.ok) {
//         throw new Error("Failed to export expenses")
//       }

//       return response.blob()
//     } catch (error) {
//       console.error("Export expenses service error:", error)
//       throw error
//     }
//   }

//   /**
//    * Transform expense data from API response
//    */
//   private transformExpenseFromAPI(apiExpense: any): Expense {
//     return {
//       ...apiExpense,
//       date: new Date(apiExpense.date),
//       createdAt: new Date(apiExpense.createdAt),
//       updatedAt: new Date(apiExpense.updatedAt),
//       amount: parseFloat(apiExpense.amount.toString()), // Handle Decimal type
//     }
//   }
// }

// export const expenseService = new ExpenseService()

import api from "./api";
import {
  type Expense,
  type CreateExpenseData,
  type UpdateExpenseData,
  type ExpenseFilters,
  type ExpenseApprovalData,
  type PaginatedResponse,
} from "./types";

export const createExpense = async (
  data: CreateExpenseData
): Promise<{ success: boolean; message: string; data: Expense }> => {
  return api.post("/expenses", data);
};

export const getExpenses = async (
  filters?: ExpenseFilters
): Promise<{ success: boolean; data: PaginatedResponse<Expense> }> => {
  const query = new URLSearchParams();

  if (filters) {
    if (filters.status) query.append("status", filters.status);
    if (filters.category) query.append("category", filters.category);
    if (filters.userId) query.append("userId", filters.userId);
    if (filters.dateFrom) query.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) query.append("dateTo", filters.dateTo);
    if (filters.page !== undefined) query.append("page", String(filters.page));
    if (filters.limit !== undefined) query.append("limit", String(filters.limit));
  }

  const queryString = query.toString();
  return api.get(`/expenses${queryString ? `?${queryString}` : ""}`);
};

export const getExpenseById = async (
  id: string
): Promise<{ success: boolean; data: Expense }> => {
  return api.get(`/expenses/${id}`);
};

export const updateExpense = async (
  id: string,
  data: UpdateExpenseData
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

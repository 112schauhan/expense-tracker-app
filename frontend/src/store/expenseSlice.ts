/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  type Expense,
  type CreateExpenseData,
  type ExpenseFilters,
  type AnalyticsData,
} from "../types"

interface ExpenseState {
  expenses: Expense[]
  analytics: AnalyticsData | null
  isLoading: boolean
  error: string | null
  filters: ExpenseFilters
}

const initialState: ExpenseState = {
  expenses: [],
  analytics: null,
  isLoading: false,
  error: null,
  filters: {},
}

export const createExpense = createAsyncThunk(
  "expenses/create",
  async (expenseData: CreateExpenseData, { getState }) => {
    const { auth } = getState() as any
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(expenseData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create expense")
    }

    return response.json()
  }
)

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async (filters: ExpenseFilters, { getState }) => {
    const { auth } = getState() as any
    const queryParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const response = await fetch(`/api/expenses?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    if (!response.ok) throw new Error("Failed to fetch expenses")
    return response.json()
  }
)

export const updateExpenseStatus = createAsyncThunk(
  "expenses/updateStatus",
  async ({ id, status }: { id: string; status: string }, { getState }) => {
    const { auth } = getState() as any
    const response = await fetch(`/api/expenses/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) throw new Error("Failed to update expense status")
    return response.json()
  }
)

export const fetchAnalytics = createAsyncThunk(
  "expenses/fetchAnalytics",
  async (_, { getState }) => {
    const { auth } = getState() as any
    const response = await fetch("/api/analytics", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    if (!response.ok) throw new Error("Failed to fetch analytics")
    return response.json()
  }
)

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload
        state.isLoading = false
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload)
        state.isLoading = false
      })
      .addCase(updateExpenseStatus.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(
          (e) => e.id === action.payload.id
        )
        if (index !== -1) {
          state.expenses[index] = action.payload
        }
        state.isLoading = false
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload
        state.isLoading = false
      })
  },
})

export const { setFilters, clearError } = expenseSlice.actions
export default expenseSlice.reducer

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  type Expense,
  type CreateExpenseData,
  type ExpenseFilters,
  type AnalyticsData,
} from "../types"
import { expenseService } from "../services/expenseService"
import { analyticsService } from "../services/analyticsService"

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
  async (expenseData: CreateExpenseData, { rejectWithValue }) => {
    try {
      const expense = await expenseService.createExpense(expenseData)
      return expense
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create expense")
    }
  }
)

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async (filters: ExpenseFilters, { rejectWithValue }) => {
    try {
      const expenses = await expenseService.getExpenses(filters)
      return expenses
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch expenses")
    }
  }
)

export const updateExpenseStatus = createAsyncThunk(
  "expenses/updateStatus",
  async (
    { id, status }: { id: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const expense = await expenseService.updateExpenseStatus(
        id,
        status as any
      )
      return expense
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update expense status")
    }
  }
)

export const fetchAnalytics = createAsyncThunk(
  "expenses/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const analytics = await analyticsService.getAnalytics()
      return analytics
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch analytics")
    }
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

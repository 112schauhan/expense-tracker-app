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

export const deleteExpense = createAsyncThunk(
  "expenses/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await expenseService.deleteExpense(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete expense")
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
    clearExpenses: (state) => {
      state.expenses = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload)
        state.isLoading = false
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload
        state.isLoading = false
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(updateExpenseStatus.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(
          (e) => e.id === action.payload.id
        )
        if (index !== -1) {
          state.expenses[index] = action.payload
        }
      })
      .addCase(updateExpenseStatus.rejected, (state, action) => {
        state.error = action.payload as string
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.error = action.payload as string
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload)
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { setFilters, clearError,clearExpenses } = expenseSlice.actions
export default expenseSlice.reducer

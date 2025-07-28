/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, type PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  type Expense,
  type CreateExpenseData,
  type UpdateExpenseData,
  type ExpenseFilters,
  type ExpenseApprovalData,
  type PaginatedResponse,
} from "../services/types";
import * as expenseService from "../services/expenseService";

// Extended expense interface with timezone context
interface ExpenseWithTimezone extends Expense {
  timezone?: string;
  timezoneContext?: {
    originalTimezone: string;
    utcDate: string;
    displayDates: {
      utc: string;
      original: string;
      viewer: string | null;
    };
  };
}

// Extended filters interface with timezone
interface ExpenseFiltersWithTimezone extends ExpenseFilters {
  timezone?: string;
}

// Extended create expense data with timezone
interface CreateExpenseDataWithTimezone extends CreateExpenseData {
  timezone: string;
}

interface ExpenseState {
  expenses: ExpenseWithTimezone[];
  paginated?: PaginatedResponse<ExpenseWithTimezone>;
  loading: boolean;
  error: string | null;
  filters: ExpenseFiltersWithTimezone;
  userTimezone?: string;
}

const initialState: ExpenseState = {
  expenses: [],
  loading: false,
  error: null,
  filters: {
    status: undefined,
    category: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    page: 1,
    limit: 10,
    timezone: undefined,
  },
  userTimezone: undefined,
};

// Thunks

export const fetchExpenses = createAsyncThunk<
  { success: boolean; data: PaginatedResponse<ExpenseWithTimezone> },
  ExpenseFiltersWithTimezone | undefined,
  { rejectValue: string }
>("expenses/fetchExpenses", async (filters, thunkAPI) => {
  try {
    const response = await expenseService.getExpenses(filters);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to fetch expenses");
  }
});

export const createExpense = createAsyncThunk<
  { success: boolean; message: string; data: ExpenseWithTimezone },
  CreateExpenseDataWithTimezone,
  { rejectValue: string }
>("expenses/createExpense", async (data, thunkAPI) => {
  try {
    const response = await expenseService.createExpense(data);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to create expense");
  }
});

export const updateExpense = createAsyncThunk<
  { success: boolean; message: string; data: ExpenseWithTimezone },
  { id: string; data: UpdateExpenseData & { timezone?: string } },
  { rejectValue: string }
>("expenses/updateExpense", async ({ id, data }, thunkAPI) => {
  try {
    const response = await expenseService.updateExpense(id, data);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to update expense");
  }
});

export const deleteExpense = createAsyncThunk<
  { success: boolean; message: string },
  string,
  { rejectValue: string }
>("expenses/deleteExpense", async (id, thunkAPI) => {
  try {
    const response = await expenseService.deleteExpense(id);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to delete expense");
  }
});

export const approveRejectExpense = createAsyncThunk<
  { success: boolean; message: string; data: ExpenseWithTimezone },
  { id: string; data: ExpenseApprovalData },
  { rejectValue: string }
>("expenses/approveRejectExpense", async ({ id, data }, thunkAPI) => {
  try {
    const response = await expenseService.approveRejectExpense(id, data);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to approve/reject expense");
  }
});

// New thunk for timezone-aware analytics
export const fetchExpenseAnalytics = createAsyncThunk<
  { success: boolean; data: any },
  { dateFrom?: string; dateTo?: string; userId?: string; timezone?: string },
  { rejectValue: string }
>("expenses/fetchAnalytics", async (params, thunkAPI) => {
  try {
    const response = await expenseService.getExpenseAnalytics(params);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to fetch analytics");
  }
});

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<ExpenseFiltersWithTimezone>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      const currentTimezone = state.filters.timezone;
      state.filters = {
        status: undefined,
        category: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        limit: 10,
        timezone: currentTimezone, // Preserve timezone when clearing filters
      };
    },
    clearError(state) {
      state.error = null;
    },
    setUserTimezone(state, action: PayloadAction<string>) {
      state.userTimezone = action.payload;
      // Also update the filters timezone if not already set
      if (!state.filters.timezone) {
        state.filters.timezone = action.payload;
      }
    },
    // Action to update timezone context for existing expenses
    updateExpenseTimezoneContext(state, action: PayloadAction<{
      userTimezone: string;
    }>) {
      const { userTimezone } = action.payload;
      
      // Update user timezone
      state.userTimezone = userTimezone;
      
      // Update filter timezone
      state.filters.timezone = userTimezone;
      
      // Note: We don't update individual expense timezone contexts here
      // as they will be refreshed from the server on next fetch
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.paginated = action.payload.data;
          state.expenses = action.payload.data.data;
          
          // Update user timezone if it's included in the response
          if (action.meta.arg?.timezone) {
            state.userTimezone = action.meta.arg.timezone;
          }
        } else {
          state.error = "Failed to load expenses";
        }
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load expenses";
      })

      // Create Expense
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          // Add newly created expense to the list (optimistic update)
          const newExpense = action.payload.data;
          
          // Ensure timezone information is preserved
          if (action.meta.arg.timezone) {
            newExpense.timezone = action.meta.arg.timezone;
          }
          
          state.expenses.unshift(newExpense);
          
          // Update pagination total if available
          if (state.paginated?.pagination) {
            state.paginated.pagination.total += 1;
          }
        } else {
          state.error = action.payload.message || "Failed to create expense";
        }
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create expense";
      })

      // Update Expense
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          const updated = action.payload.data;
          const index = state.expenses.findIndex((ex) => ex.id === updated.id);
          if (index !== -1) {
            // Preserve any timezone context that might exist
            const existingTimezoneContext = state.expenses[index].timezoneContext;
            state.expenses[index] = {
              ...updated,
              timezoneContext: existingTimezoneContext,
            };
          }
        } else {
          state.error = action.payload.message || "Failed to update expense";
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update expense";
      })

      // Delete Expense
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          // Remove the deleted expense from state
          // Note: Since we don't have the ID here, we'll let the component handle re-fetching
          // Alternatively, you could modify the thunk to return the deleted expense ID
        } else {
          state.error = action.payload.message || "Failed to delete expense";
        }
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete expense";
      })

      // Approve/Reject Expense
      .addCase(approveRejectExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveRejectExpense.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          const updated = action.payload.data;
          const index = state.expenses.findIndex((ex) => ex.id === updated.id);
          if (index !== -1) {
            // Preserve any timezone context that might exist
            const existingTimezoneContext = state.expenses[index].timezoneContext;
            state.expenses[index] = {
              ...updated,
              timezoneContext: existingTimezoneContext,
            };
          }
        } else {
          state.error = action.payload.message || "Failed to process expense";
        }
      })
      .addCase(approveRejectExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to process expense";
      })

      // Fetch Analytics
      .addCase(fetchExpenseAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.success) {
          state.error = "Failed to load analytics";
        }
        // Analytics data would typically be stored in a separate slice
        // but we handle loading/error states here
      })
      .addCase(fetchExpenseAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load analytics";
      });
  },
});

export const { 
  setFilters, 
  clearFilters, 
  clearError, 
  setUserTimezone, 
  updateExpenseTimezoneContext 
} = expenseSlice.actions;

export default expenseSlice.reducer;
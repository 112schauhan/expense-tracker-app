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

interface ExpenseState {
  expenses: Expense[];
  paginated?: PaginatedResponse<Expense>;
  loading: boolean;
  error: string | null;
  filters: ExpenseFilters;
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
  },
};

// Thunks

export const fetchExpenses = createAsyncThunk<
  { success: boolean; data: PaginatedResponse<Expense> },
  ExpenseFilters | undefined,
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
  { success: boolean; message: string; data: Expense },
  CreateExpenseData,
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
  { success: boolean; message: string; data: Expense },
  { id: string; data: UpdateExpenseData },
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
  { success: boolean; message: string; data: Expense },
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

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<ExpenseFilters>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = {
        status: undefined,
        category: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        limit: 10,
      };
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
          state.expenses.unshift(action.payload.data);
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
            state.expenses[index] = updated;
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
          // Remove expense from list
          // As id is only passed to thunk, remove from current list by id slice
          // Not passing id here so do nothing, app can re-fetch or remove manually
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
            state.expenses[index] = updated;
          }
        } else {
          state.error = action.payload.message || "Failed to process expense";
        }
      })
      .addCase(approveRejectExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to process expense";
      });
  },
});

export const { setFilters, clearFilters } = expenseSlice.actions;
export default expenseSlice.reducer;


// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
// import {
//   type Expense,
//   type CreateExpenseData,
//   type ExpenseFilters,
//   type AnalyticsData,
// } from "../types"
// import { expenseService } from "../services/expenseService"
// import { analyticsService } from "../services/analyticsService"

// interface ExpenseState {
//   expenses: Expense[]
//   analytics: AnalyticsData | null
//   isLoading: boolean
//   error: string | null
//   filters: ExpenseFilters
// }

// const initialState: ExpenseState = {
//   expenses: [],
//   analytics: null,
//   isLoading: false,
//   error: null,
//   filters: {},
// }

// export const createExpense = createAsyncThunk(
//   "expenses/create",
//   async (expenseData: CreateExpenseData, { rejectWithValue }) => {
//     try {
//       const expense = await expenseService.createExpense(expenseData)
//       return expense
//     } catch (error: any) {
//       return rejectWithValue(error.message || "Failed to create expense")
//     }
//   }
// )

// export const fetchExpenses = createAsyncThunk(
//   "expenses/fetchExpenses",
//   async (filters: ExpenseFilters, { rejectWithValue }) => {
//     try {
//       const expenses = await expenseService.getExpenses(filters)
//       return expenses
//     } catch (error: any) {
//       return rejectWithValue(error.message || "Failed to fetch expenses")
//     }
//   }
// )

// export const updateExpenseStatus = createAsyncThunk(
//   "expenses/updateStatus",
//   async (
//     { id, status }: { id: string; status: string },
//     { rejectWithValue }
//   ) => {
//     try {
//       const expense = await expenseService.updateExpenseStatus(
//         id,
//         status as any
//       )
//       return expense
//     } catch (error: any) {
//       return rejectWithValue(error.message || "Failed to update expense status")
//     }
//   }
// )

// export const fetchAnalytics = createAsyncThunk(
//   "expenses/fetchAnalytics",
//   async (_, { rejectWithValue }) => {
//     try {
//       const analytics = await analyticsService.getAnalytics()
//       return analytics
//     } catch (error: any) {
//       return rejectWithValue(error.message || "Failed to fetch analytics")
//     }
//   }
// )

// export const deleteExpense = createAsyncThunk(
//   "expenses/delete",
//   async (id: string, { rejectWithValue }) => {
//     try {
//       await expenseService.deleteExpense(id)
//       return id
//     } catch (error: any) {
//       return rejectWithValue(error.message || "Failed to delete expense")
//     }
//   }
// )

// const expenseSlice = createSlice({
//   name: "expenses",
//   initialState,
//   reducers: {
//     setFilters: (state, action) => {
//       state.filters = action.payload
//     },
//     clearError: (state) => {
//       state.error = null
//     },
//     clearExpenses: (state) => {
//       state.expenses = []
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(createExpense.pending, (state) => {
//         state.isLoading = true
//         state.error = null
//       })
//       .addCase(createExpense.fulfilled, (state, action) => {
//         state.expenses.unshift(action.payload)
//         state.isLoading = false
//       })
//       .addCase(createExpense.rejected, (state, action) => {
//         state.isLoading = false
//         state.error = action.payload as string
//       })
//       .addCase(fetchExpenses.pending, (state) => {
//         state.isLoading = true
//         state.error = null
//       })
//       .addCase(fetchExpenses.fulfilled, (state, action) => {
//         state.expenses = action.payload
//         state.isLoading = false
//       })
//       .addCase(fetchExpenses.rejected, (state, action) => {
//         state.isLoading = false
//         state.error = action.payload as string
//       })
//       .addCase(updateExpenseStatus.fulfilled, (state, action) => {
//         const index = state.expenses.findIndex(
//           (e) => e.id === action.payload.id
//         )
//         if (index !== -1) {
//           state.expenses[index] = action.payload
//         }
//       })
//       .addCase(updateExpenseStatus.rejected, (state, action) => {
//         state.error = action.payload as string
//       })
//       .addCase(fetchAnalytics.fulfilled, (state, action) => {
//         state.analytics = action.payload
//       })
//       .addCase(fetchAnalytics.rejected, (state, action) => {
//         state.error = action.payload as string
//       })
//       .addCase(deleteExpense.fulfilled, (state, action) => {
//         state.expenses = state.expenses.filter((e) => e.id !== action.payload)
//       })
//       .addCase(deleteExpense.rejected, (state, action) => {
//         state.error = action.payload as string
//       })
//   },
// })

// export const { setFilters, clearError,clearExpenses } = expenseSlice.actions
// export default expenseSlice.reducer

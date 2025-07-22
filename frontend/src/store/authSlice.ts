/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { User } from "../types"
import { authService } from "../services/authService"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

const loadStoredAuth = (): { user: User | null; token: string | null } => {
  try {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken || null,
    }
  } catch (error) {
    console.error("Error loading stored auth:", error)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    return { user: null, token: null }
  }
}

const { user: storedUser, token: storedToken } = loadStoredAuth()

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isLoading: false,
  error: null,
}

export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.login({ email, password })
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed")
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser()
      return user
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to get user")
    }
  }
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.error = null
      authService.logout()
    },
    clearError: (state) => {
      state.error = null
    },
    restoreAuth: (state) => {
      const { user, token } = loadStoredAuth()
      state.user = user
      state.token = token
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
        localStorage.setItem("user", JSON.stringify(action.payload.user))
        localStorage.setItem("token", action.payload.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Login failed"
        state.user = null
        state.token = null
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.error = null
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError, restoreAuth } = authSlice.actions
export default authSlice.reducer

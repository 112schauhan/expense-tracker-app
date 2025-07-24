/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  type User,
  type LoginCredentials,
  type RegisterData,
  type AuthResponse,
  type ChangePasswordData,
} from "../services/types";
import * as authService from "../services/authService";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const tokenFromStorage = localStorage.getItem("token");
const userFromStorage = localStorage.getItem("user");

const initialState: AuthState = {
  token: tokenFromStorage,
  user: userFromStorage ? JSON.parse(userFromStorage) : null,
  loading: false,
  error: null,
};

// Async Thunks

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterData,
  { rejectValue: string }
>("auth/registerUser", async (data, thunkAPI) => {
  try {
    const response = await authService.register(data);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Registration failed");
  }
});

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/loginUser", async (credentials, thunkAPI) => {
  try {
    const response = await authService.login(credentials);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Login failed");
  }
});

export const fetchProfile = createAsyncThunk<
  { success: boolean; data: User },
  void,
  { rejectValue: string }
>("auth/fetchProfile", async (_, thunkAPI) => {
  try {
    const response = await authService.getProfile();
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to fetch profile");
  }
});

export const updateProfileName = createAsyncThunk<
  { success: boolean; message: string; data: User },
  string,
  { rejectValue: string }
>("auth/updateProfileName", async (name, thunkAPI) => {
  try {
    const response = await authService.updateProfile(name);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to update profile");
  }
});

export const changePassword = createAsyncThunk<
  { success: boolean; message: string },
  ChangePasswordData,
  { rejectValue: string }
>("auth/changePassword", async (data, thunkAPI) => {
  try {
    const response = await authService.changePassword(data);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to change password");
  }
});

export const refreshToken = createAsyncThunk<
  { success: boolean; data: { token: string } },
  void,
  { rejectValue: string }
>("auth/refreshToken", async (_, thunkAPI) => {
  try {
    const response = await authService.refreshToken();
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Failed to refresh token");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.user = action.payload.data?.user || null;
          state.token = action.payload.data?.token || null;
          if (state.token) localStorage.setItem("token", state.token);
          if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
        } else {
          state.error = action.payload.message || "Registration failed";
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.user = action.payload.data?.user || null;
          state.token = action.payload.data?.token || null;
          if (state.token) localStorage.setItem("token", state.token);
          if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
        } else {
          state.error = action.payload.message || "Login failed";
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      // Fetch Profile
      .addCase(fetchProfile.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.user = action.payload.data;
          if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
        }
      })

      // Update Profile Name
      .addCase(updateProfileName.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.user = action.payload.data;
          if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
        }
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Change password failed";
      })

      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.token = action.payload.data.token;
          localStorage.setItem("token", state.token);
        }
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;


// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
// import type { User } from "../types"
// import { authService } from "../services/authService"

// interface AuthState {
//   user: User | null
//   token: string | null
//   isLoading: boolean
//   error: string | null
// }

// const loadStoredAuth = (): { user: User | null; token: string | null } => {
//   try {
//     const storedUser = localStorage.getItem("user")
//     const storedToken = localStorage.getItem("token")

//     return {
//       user: storedUser ? JSON.parse(storedUser) : null,
//       token: storedToken || null,
//     }
//   } catch (error) {
//     console.error("Error loading stored auth:", error)
//     localStorage.removeItem("user")
//     localStorage.removeItem("token")
//     return { user: null, token: null }
//   }
// }

// const { user: storedUser, token: storedToken } = loadStoredAuth()

// const initialState: AuthState = {
//   user: storedUser,
//   token: storedToken,
//   isLoading: false,
//   error: null,
// }

// export const login = createAsyncThunk(
//   "auth/login",
//   async (
//     { email, password }: { email: string; password: string },
//     { rejectWithValue }
//   ) => {
//     try {
//       const response = await authService.login({ email, password })
//       return response
//     } catch (error: any) {
//       return rejectWithValue(error.message || "Login failed")
//     }
//   }
// )

// export const getCurrentUser = createAsyncThunk(
//   "auth/getCurrentUser",
//   async (_, { rejectWithValue }) => {
//     try {
//       const user = await authService.getCurrentUser()
//       return user
//     } catch (error: any) {
//       return rejectWithValue(error.message || "Failed to get user")
//     }
//   }
// )

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     logout: (state) => {
//       state.user = null
//       state.token = null
//       state.error = null
//       authService.logout()
//     },
//     clearError: (state) => {
//       state.error = null
//     },
//     restoreAuth: (state) => {
//       const { user, token } = loadStoredAuth()
//       state.user = user
//       state.token = token
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(login.pending, (state) => {
//         state.isLoading = true
//         state.error = null
//       })
//       .addCase(login.fulfilled, (state, action) => {
//         state.isLoading = false
//         state.user = action.payload.user
//         state.token = action.payload.token
//         state.error = null
//         localStorage.setItem("user", JSON.stringify(action.payload.user))
//         localStorage.setItem("token", action.payload.token)
//       })
//       .addCase(login.rejected, (state, action) => {
//         state.isLoading = false
//         state.error = action.error.message || "Login failed"
//         state.user = null
//         state.token = null
//       })
//       .addCase(getCurrentUser.fulfilled, (state, action) => {
//         state.user = action.payload
//         state.error = null
//       })
//       .addCase(getCurrentUser.rejected, (state, action) => {
//         state.error = action.payload as string
//       })
//   },
// })

// export const { logout, clearError, restoreAuth } = authSlice.actions
// export default authSlice.reducer

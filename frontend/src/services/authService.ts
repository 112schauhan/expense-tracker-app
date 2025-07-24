// import { apiClient } from "./api"
// import { type User } from "../types"

// export interface LoginCredentials {
//   email: string
//   password: string
// }

// export interface LoginResponse {
//   token: string
//   user: User
// }

// export interface RegisterData {
//   name: string
//   email: string
//   password: string
//   confirmPassword: string
// }

// class AuthService {
//   async login(credentials: LoginCredentials): Promise<LoginResponse> {
//     try {
//       const response = await apiClient.post<LoginResponse>("/auth/login", {
//         email: credentials.email.trim(),
//         password: credentials.password,
//       })

//       if (!response.token || !response.user) {
//         throw new Error("Invalid response from server")
//       }

//       return response
//     } catch (error) {
//       console.error("Login service error:", error)
//       throw error
//     }
//   }

//   async register(userData: RegisterData): Promise<LoginResponse> {
//     try {
//       if (userData.password !== userData.confirmPassword) {
//         throw new Error("Passwords do not match")
//       }

//       const response = await apiClient.post<LoginResponse>("/auth/register", {
//         name: userData.name.trim(),
//         email: userData.email.trim(),
//         password: userData.password,
//       })

//       return response
//     } catch (error) {
//       console.error("Registration service error:", error)
//       throw error
//     }
//   }

//   logout(): void {
//     localStorage.removeItem("token")
//     localStorage.removeItem("user")
//   }

//   async getCurrentUser(): Promise<User> {
//     try {
//       const response = await apiClient.get<User>("/auth/me")
//       return response
//     } catch (error) {
//       console.error("Get current user error:", error)
//       throw error
//     }
//   }

//   async refreshToken(): Promise<LoginResponse> {
//     try {
//       const response = await apiClient.post<LoginResponse>("/auth/refresh")
//       return response
//     } catch (error) {
//       console.error("Token refresh error:", error)
//       throw error
//     }
//   }

//   async updateProfile(updates: Partial<User>): Promise<User> {
//     try {
//       const response = await apiClient.put<User>("/auth/profile", updates)
//       return response
//     } catch (error) {
//       console.error("Update profile error:", error)
//       throw error
//     }
//   }

//   async changePassword(
//     currentPassword: string,
//     newPassword: string
//   ): Promise<void> {
//     try {
//       await apiClient.post("/auth/change-password", {
//         currentPassword,
//         newPassword,
//       })
//     } catch (error) {
//       console.error("Change password error:", error)
//       throw error
//     }
//   }

//   async requestPasswordReset(email: string): Promise<void> {
//     try {
//       await apiClient.post("/auth/forgot-password", { email })
//     } catch (error) {
//       console.error("Password reset request error:", error)
//       throw error
//     }
//   }

//   async resetPassword(token: string, newPassword: string): Promise<void> {
//     try {
//       await apiClient.post("/auth/reset-password", {
//         token,
//         newPassword,
//       })
//     } catch (error) {
//       console.error("Password reset error:", error)
//       throw error
//     }
//   }

 
//   async verifySession(): Promise<boolean> {
//     try {
//       await this.getCurrentUser()
//       return true
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (error: unknown) {
//       return false
//     }
//   }
// }

// export const authService = new AuthService()

import api from "./api";
import {
  type AuthResponse,
  type LoginCredentials,
  type RegisterData,
  type User,
  type ChangePasswordData,
} from "./types";

export const register = async (
  data: RegisterData
): Promise<AuthResponse> => {
  return api.post<AuthResponse>("/auth/register", data, { auth: false });
};

export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  return api.post<AuthResponse>("/auth/login", credentials, { auth: false });
};

export const getProfile = async (): Promise<{ success: boolean; data: User }> => {
  return api.get<{ success: boolean; data: User }>("/auth/profile");
};

export const updateProfile = async (
  name: string
): Promise<{ success: boolean; message: string; data: User }> => {
  return api.put<{ success: boolean; message: string; data: User }>("/auth/profile", { name });
};

export const changePassword = async (
  data: ChangePasswordData
): Promise<{ success: boolean; message: string }> => {
  return api.post("/auth/change-password", data);
};

export const refreshToken = async (): Promise<{ success: boolean; data: { token: string } }> => {
  return api.post("/auth/refresh-token", {});
};

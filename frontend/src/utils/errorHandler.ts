import { ApiError } from "../services/api"

export class ErrorHandler {
  static handleApiError(error: unknown): string {
    if (error instanceof ApiError) {
      // Handle specific API errors
      if (error.isAuthError) {
        // Redirect to login or refresh token
        return "Authentication failed. Please log in again."
      }

      if (error.isClientError) {
        return error.message || "Invalid request"
      }

      if (error.isServerError) {
        return "Server error occurred. Please try again later."
      }

      return error.message
    }

    if (error instanceof Error) {
      return error.message
    }

    return "An unexpected error occurred"
  }

  static handleNetworkError(): string {
    return "Network error. Please check your connection and try again."
  }

  static handleValidationErrors(errors: string[]): string {
    return errors.join(", ")
  }
}

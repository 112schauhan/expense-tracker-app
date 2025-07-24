
class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor() {
    this.baseURL = import.meta.env.VITE_APP_URL || "/api"
    this.defaultHeaders = {
      "Content-Type": "application/json",
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token")
    console.log("🔑 Token from localStorage:", token)
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async handleResponse<T>(response: Response, url: string): Promise<T> {
    console.log(`📡 ApiClient - Response for ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorData = null

      try {
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error("❌ ApiClient - Error response:", errorData)
        }
      } catch (parseError) {
        console.error(
          "❌ ApiClient - Could not parse error response:",
          parseError
        )
      }

      throw new ApiError(errorMessage, response.status, errorData)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      console.log(`✅ ApiClient - Success response for ${url}:`, data)
      return data
    }

    const textData = await response.text()
    console.log(`✅ ApiClient - Text response for ${url}:`, textData)
    return textData as unknown as T
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const authHeaders = this.getAuthHeaders()
    console.log("🔐 Headers:", { ...this.defaultHeaders, ...authHeaders }) // Debug log

    const config: RequestInit = {
      method: "GET",
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse<T>(response,url)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Network error occurred", 0, { originalError: error })
    }
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      method: "POST",
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse<T>(response,url)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Network error occurred", 0, { originalError: error })
    }
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      method: "PUT",
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse<T>(response,url)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Network error occurred", 0, { originalError: error })
    }
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      method: "PATCH",
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse<T>(response,url)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Network error occurred", 0, { originalError: error })
    }
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      method: "DELETE",
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      return this.handleResponse<T>(response,url)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Network error occurred", 0, { originalError: error })
    }
  }
}

export class ApiError extends Error {
  public status: number
  public data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  get isServerError(): boolean {
    return this.status >= 500
  }
}

export const apiClient = new ApiClient()

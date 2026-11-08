const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://teacher-world.onrender.com/api"

interface ApiResponse<T> {
  status: number
  data?: T
  error?: string
  message?: string
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE}${endpoint}`
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          status: response.status,
          error: data.message || "An error occurred",
        }
      }

      return {
        status: response.status,
        data,
      }
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" })
  },

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  },
}

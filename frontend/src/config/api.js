/**
 * Teacher World - Centralized API & Environment Configuration
 *
 * Backend URL: https://teacher-world.onrender.com
 * API Base URL: https://teacher-world.onrender.com/api
 */

// Use explicitly passed VITE_API_URL or default to the live Render backend
export const API_URL = (
  import.meta.env.VITE_API_URL || "https://teacher-world.onrender.com/api"
).replace(/\/+$/, "")

// Base URL without /api (for Socket.io, static uploads, video calls)
export const BASE_URL = API_URL.replace(/\/api\/?$/i, "")

// Helper to normalize any endpoint or asset path and avoid duplicate /api prefixes
export const getFullApiUrl = (endpoint = "") => {
  if (!endpoint) return API_URL
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  if (clean.startsWith("/api/")) {
    return `${BASE_URL}${clean}`
  }
  return `${API_URL}${clean}`
}

export default API_URL

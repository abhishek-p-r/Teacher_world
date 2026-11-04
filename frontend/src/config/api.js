/**
 * Teacher World - Centralized API & Environment Configuration
 *
 * Automatically switches between:
 * - Development URL: http://localhost:5000/api
 * - Production URL: https://teacher-world.onrender.com/api
 */

const isProd = import.meta.env.PROD || import.meta.env.MODE === "production"

// Priority:
// 1. Explicit VITE_API_URL in environment (Vercel, .env, etc.)
// 2. Production: https://teacher-world.onrender.com/api
// 3. Development: http://localhost:5000/api
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (isProd ? "https://teacher-world.onrender.com/api" : "http://localhost:5000/api")
).replace(/\/+$/, "")

// Base URL without /api (for Socket.io, Daily.co video calls, static uploads)
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

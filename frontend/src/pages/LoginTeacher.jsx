"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react"
import { GoogleLogin } from "@react-oauth/google"

import { API_URL } from "../config/api"

export default function LoginTeacher() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        ...formData,
        role: "teacher",
      })
      localStorage.setItem("accessToken", response.data.accessToken)
      localStorage.setItem("refreshToken", response.data.refreshToken)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      // Check if there's a redirect path stored (e.g., from job application)
      const redirectPath = localStorage.getItem("redirectAfterLogin")
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin")
        navigate(redirectPath)
      } else {
        navigate("/dashboard/teacher")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!GoogleLogin) {
      setError("Google login is not available")
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/google/callback`, {
        token: credentialResponse.credential,
        role: "teacher",
      })

      localStorage.setItem("accessToken", response.data.accessToken)
      localStorage.setItem("refreshToken", response.data.refreshToken)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      // Check if there's a redirect path stored (e.g., from job application)
      const redirectPath = localStorage.getItem("redirectAfterLogin")
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin")
        navigate(redirectPath)
      } else {
        navigate("/dashboard/teacher")
      }
    } catch (err) {
      setError("Google login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center" }}>
      <div style={{ maxWidth: "420px", margin: "0 auto", width: "100%", padding: "20px" }}>
        <div
          style={{
            background: "white",
            padding: "2.5rem",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1 style={{ textAlign: "center", color: "#1a5490", marginBottom: "0.5rem", fontSize: "1.75rem" }}>
              TeacherWorld
            </h1>
          </Link>
          <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem", fontSize: "0.9rem" }}>
            Sign in to your teacher account
          </p>

          {error && (
            <div
              style={{
                padding: "12px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "6px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1a5490")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    paddingRight: "2.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1a5490")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                    padding: "0.25rem",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
                flexWrap: "wrap",
              }}
            >
              <Link to="/forgot-password" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>
                Forgot Password?
              </Link>
              <Link to="/forgot-username" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>
                Forgot Username?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.875rem",
                background: loading ? "#1a5490cc" : "#1a5490",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = "#0f3a63")}
              onMouseLeave={(e) => !loading && (e.target.style.background = "#1a5490")}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {GoogleLogin && (
            <>
              <div style={{ margin: "1.5rem 0", textAlign: "center", color: "#999" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <hr style={{ flex: 1, borderColor: "#ddd" }} />
                  <span style={{ fontSize: "0.875rem" }}>OR</span>
                  <hr style={{ flex: 1, borderColor: "#ddd" }} />
                </div>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <GoogleLogin
                  clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login failed")}
                />
              </div>
            </>
          )}

          <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#666", fontSize: "0.9rem" }}>
            Don't have an account?{" "}
            <Link to="/register-teacher" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>
              Register as Teacher
            </Link>
          </p>
          <p style={{ textAlign: "center", marginTop: "0.75rem", color: "#666", fontSize: "0.85rem" }}>
            Are you an institution?{" "}
            <Link to="/login-institution" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

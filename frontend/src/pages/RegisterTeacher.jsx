"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

import { API_URL, BASE_URL } from "../config/api"
console.log("[RegisterTeacher] API URL:", API_URL, "BASE_URL:", BASE_URL)

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "#cbd5e1", percent: 0, checks: { length: false, letters: false, numbers: false, symbols: false } }

  const hasMinLength = pwd.length >= 8
  const hasLetter = /[a-zA-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)
  const hasUpperLower = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd)
  const isLong = pwd.length >= 10

  const checks = {
    length: hasMinLength,
    letters: hasLetter,
    numbers: hasNumber,
    symbols: hasSymbol,
  }

  const allMandatory = hasMinLength && hasLetter && hasNumber && hasSymbol

  if (allMandatory && (hasUpperLower || isLong)) {
    return { score: 3, label: "Strong", color: "#10b981", percent: 100, checks }
  } else if (allMandatory) {
    return { score: 2, label: "Medium", color: "#f59e0b", percent: 66, checks }
  } else {
    return { score: 1, label: "Weak", color: "#ef4444", percent: 33, checks }
  }
}

export default function RegisterTeacher() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!formData.name.trim()) {
      setError("Please enter your full name")
      return
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const pwdStrength = getPasswordStrength(formData.password)
    if (!pwdStrength.checks.length || !pwdStrength.checks.letters || !pwdStrength.checks.numbers || !pwdStrength.checks.symbols) {
      setError("Password must be at least 8 characters long and contain letters, numbers, and special symbols (!@#$...).")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      // Try primary endpoint first, then alias routes if 404 occurs
      let response
      try {
        response = await axios.post(`${API_URL}/auth/register-teacher`, payload)
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          console.warn("[RegisterTeacher] /auth/register-teacher returned 404, retrying with /register-teacher...")
          try {
            response = await axios.post(`${API_URL}/register-teacher`, payload)
          } catch (retryErr1) {
            if (retryErr1.response?.status === 404) {
              console.warn("[RegisterTeacher] /register-teacher returned 404, retrying with BASE_URL /register-teacher...")
              try {
                response = await axios.post(`${BASE_URL}/register-teacher`, payload)
              } catch (retryErr2) {
                if (retryErr2.response?.status === 404) {
                  console.warn("[RegisterTeacher] BASE_URL returned 404, retrying with /auth/register...")
                  response = await axios.post(`${API_URL}/auth/register`, payload)
                } else {
                  throw retryErr2
                }
              }
            } else {
              throw retryErr1
            }
          }
        } else {
          throw postErr
        }
      }

      console.log("[RegisterTeacher] Registration successful:", response.data)
      setOtp("")
      setSuccessMessage(response.data.message || "A 6-digit verification code has been sent to your email. Please check your inbox and spam folder.")
      setCurrentStep(2)
    } catch (err) {
      console.error("[RegisterTeacher] Full Error Object:", err)
      console.error("[RegisterTeacher] Error Config:", err.config)
      console.error("[RegisterTeacher] Error Response:", err.response?.data)
      console.error("[RegisterTeacher] Error Status:", err.response?.status)
      console.error("[RegisterTeacher] Error Message:", err.message)

      let errorMessage = "Registration failed. Please try again."

      if (err.code === "ERR_NETWORK") {
        errorMessage = "Network Error: Cannot connect to the server (https://teacher-world.onrender.com). Please verify your internet connection or check backend status."
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data.message || "Invalid input. Please check your details."
      } else if (err.response?.status === 404) {
        errorMessage = err.response.data?.message || "Registration service temporarily unavailable (404). Please try again or check backend connection."
      } else if (err.response?.status === 409) {
        errorMessage = err.response.data?.message || "Email already registered. Please login instead."
      } else if (err.response?.status === 429) {
        errorMessage = err.response.data?.message || "Too many OTP requests. Please wait a while before trying again."
      } else if (err.response?.status === 500) {
        errorMessage = err.response.data.message || "Server error. Please try again later."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    try {
      console.log("[RegisterTeacher] Sending OTP verification...")
      const otpPayload = {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim(),
        name: formData.name.trim(),
        password: formData.password,
        role: "teacher",
      }

      let response
      try {
        response = await axios.post(`${API_URL}/auth/verify-otp`, otpPayload)
      } catch (otpErr) {
        if (otpErr.response?.status === 404) {
          try {
            response = await axios.post(`${API_URL}/verify-otp`, otpPayload)
          } catch (retryOtpErr) {
            if (retryOtpErr.response?.status === 404) {
              response = await axios.post(`${BASE_URL}/verify-otp`, otpPayload)
            } else {
              throw retryOtpErr
            }
          }
        } else {
          throw otpErr
        }
      }

      console.log("[RegisterTeacher] OTP verification successful:", response.data)

      // Store tokens
      localStorage.setItem("accessToken", response.data.accessToken)
      localStorage.setItem("refreshToken", response.data.refreshToken)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      setSuccessMessage("Registration successful! Redirecting to dashboard...")
      setTimeout(() => {
        navigate("/dashboard/teacher", { state: { showProfileCompletion: true } })
      }, 1500)
    } catch (err) {
      console.error("[RegisterTeacher] OTP verification error:", err)
      const errorMessage = err.response?.data?.message || err.message || "OTP verification failed. Please try again."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setSuccessMessage("")
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/resend-otp`, {
        email: formData.email.trim().toLowerCase(),
      })
      setOtp("")
      setSuccessMessage(response.data.message || `A fresh 6-digit OTP has been sent to ${formData.email}! Please check your inbox and spam folder.`)
    } catch (resendErr) {
      setError(resendErr.response?.data?.message || "Failed to resend OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "450px", width: "100%" }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "white", fontSize: "32px", fontWeight: "bold", margin: "0 0 10px 0" }}>TeacherWorld</h1>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", margin: 0 }}>Connect • Grow • Lead</p>
        </div>

        {/* Card Container */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        >
          {/* Progress Indicator */}
          <div style={{ display: "flex", background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
            <div
              style={{
                flex: 1,
                padding: "16px",
                textAlign: "center",
                borderBottom: currentStep === 1 ? "3px solid #667eea" : "none",
                color: currentStep === 1 ? "#667eea" : "#999",
                fontWeight: currentStep === 1 ? "600" : "500",
                fontSize: "14px",
              }}
            >
              Step 1: Details
            </div>
            <div
              style={{
                flex: 1,
                padding: "16px",
                textAlign: "center",
                borderBottom: currentStep === 2 ? "3px solid #667eea" : "none",
                color: currentStep === 2 ? "#667eea" : "#999",
                fontWeight: currentStep === 2 ? "600" : "500",
                fontSize: "14px",
              }}
            >
              Step 2: Verify
            </div>
          </div>

          {/* Form Content */}
          <div style={{ padding: "40px" }}>
            <h2 style={{ marginBottom: "10px", color: "#1a1a1a", fontSize: "24px", fontWeight: "bold" }}>
              {currentStep === 1 ? "Create Your Account" : "Verify Your Email"}
            </h2>
            <p style={{ marginBottom: "30px", color: "#666", fontSize: "14px" }}>
              {currentStep === 1 ? "Join thousands of educators" : "Enter the OTP sent to your email"}
            </p>

            {error && (
              <div
                style={{
                  background: "#fee",
                  border: "1px solid #fcc",
                  color: "#c33",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  background: "#efe",
                  border: "1px solid #cfc",
                  color: "#3c3",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                {successMessage}
              </div>
            )}

            {currentStep === 1 ? (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#333",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#333",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#333",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="Min 8 chars with letters, numbers & symbols"
                  />
                  {formData.password && (() => {
                    const str = getPasswordStrength(formData.password)
                    return (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Password Strength:</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: str.color }}>
                            {str.label} Password
                          </span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${str.percent}%`, height: "100%", background: str.color, transition: "width 0.3s, background 0.3s" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginTop: "8px" }}>
                          <span style={{ fontSize: "11px", color: str.checks.length ? "#10b981" : "#94a3b8" }}>
                            {str.checks.length ? "✓" : "✗"} 8+ Characters
                          </span>
                          <span style={{ fontSize: "11px", color: str.checks.letters ? "#10b981" : "#94a3b8" }}>
                            {str.checks.letters ? "✓" : "✗"} Letters (a-z, A-Z)
                          </span>
                          <span style={{ fontSize: "11px", color: str.checks.numbers ? "#10b981" : "#94a3b8" }}>
                            {str.checks.numbers ? "✓" : "✗"} Numbers (0-9)
                          </span>
                          <span style={{ fontSize: "11px", color: str.checks.symbols ? "#10b981" : "#94a3b8" }}>
                            {str.checks.symbols ? "✓" : "✗"} Special Symbol (!@#$)
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#333",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: loading ? "#999" : "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.3s",
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.background = "#5568d3")}
                  onMouseLeave={(e) => !loading && (e.target.style.background = "#667eea")}
                >
                  {loading ? "Sending OTP..." : "Continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOTPSubmit}>
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "12px",
                      color: "#333",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    style={{
                      width: "100%",
                      padding: "16px 14px",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "24px",
                      fontWeight: "bold",
                      letterSpacing: "8px",
                      textAlign: "center",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6).replace(/[^0-9]/g, ""))}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="Enter 6-digit code"
                  />
                  <div style={{ textAlign: "center", marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <p style={{ color: "#475569", fontSize: "13px", margin: "0", lineHeight: "1.5" }}>
                      ✉️ A 6-digit verification code was sent to <strong>{formData.email}</strong>.
                      <br />
                      Please check your inbox (or spam folder) and enter it above to activate your account.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: loading || otp.length !== 6 ? "#ccc" : "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                    transition: "background 0.3s",
                  }}
                  onMouseEnter={(e) => !loading && otp.length === 6 && (e.target.style.background = "#5568d3")}
                  onMouseLeave={(e) => !loading && otp.length === 6 && (e.target.style.background = "#667eea")}
                >
                  {loading ? "Verifying..." : "Verify & Complete"}
                </button>

                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResendOTP}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      background: "#f0f4ff",
                      color: "#667eea",
                      border: "2px solid #667eea",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.background = "#e0e7ff")}
                    onMouseLeave={(e) => !loading && (e.target.style.background = "#f0f4ff")}
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1)
                      setOtp("")
                      setError("")
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      background: "white",
                      color: "#666",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#f9f9f9")}
                    onMouseLeave={(e) => (e.target.style.background = "white")}
                  >
                    Back / Edit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Links */}
        <div style={{ textAlign: "center", marginTop: "30px", color: "white" }}>
          <p style={{ fontSize: "14px", margin: 0 }}>
            Already have an account?{" "}
            <Link to="/login-teacher" style={{ color: "white", textDecoration: "underline", fontWeight: "600" }}>
              Login here
            </Link>
          </p>
          <p style={{ fontSize: "12px", marginTop: "10px", opacity: 0.9 }}>
            Or register as an{" "}
            <Link to="/register-institution" style={{ color: "white", textDecoration: "underline", fontWeight: "600" }}>
              Institution
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

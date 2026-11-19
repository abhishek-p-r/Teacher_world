"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { Sparkles, Eye, EyeOff, Copy, Check } from "lucide-react"

import { API_URL, BASE_URL } from "../config/api"
console.log("[RegisterTeacher] API URL:", API_URL, "BASE_URL:", BASE_URL)

const generateStrongPassword = () => {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lowers = "abcdefghijkmnopqrstuvwxyz"
  const numbers = "23456789"
  const symbols = "!@#$%^&*+=-_"

  let pwd = ""
  for (let i = 0; i < 3; i++) pwd += uppers[Math.floor(Math.random() * uppers.length)]
  for (let i = 0; i < 3; i++) pwd += lowers[Math.floor(Math.random() * lowers.length)]
  for (let i = 0; i < 3; i++) pwd += numbers[Math.floor(Math.random() * numbers.length)]
  for (let i = 0; i < 3; i++) pwd += symbols[Math.floor(Math.random() * symbols.length)]

  return pwd.split("").sort(() => Math.random() - 0.5).join("")
}

const getPasswordStrength = (pwd) => {
  const p = String(pwd || "")
  const hasMinLength = p.length >= 8
  const hasUpper = /[A-Z]/.test(p)
  const hasLower = /[a-z]/.test(p)
  const hasLetter = /[a-zA-Z]/.test(p)
  const hasUpperAndLower = hasUpper && hasLower
  const hasNumber = /[0-9]/.test(p)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p)

  const checks = {
    length: hasMinLength,
    letters: hasUpperAndLower,
    hasAnyLetter: hasLetter,
    numbers: hasNumber,
    symbols: hasSymbol,
  }

  if (!p) {
    return {
      score: 0,
      label: "Not Entered",
      color: "#94a3b8",
      bgColor: "#f1f5f9",
      percent: 0,
      checks,
      isValid: false,
    }
  }

  // Strong: Must contain 8+ characters, BOTH uppercase and lowercase, numbers, AND symbols
  if (hasMinLength && hasUpperAndLower && hasNumber && hasSymbol) {
    return {
      score: 3,
      label: "Strong Password",
      color: "#10b981",
      bgColor: "#ecfdf5",
      percent: 100,
      checks,
      isValid: true,
    }
  }

  // Medium: Has 8+ chars, letters, numbers, and symbols
  if (hasMinLength && hasLetter && hasNumber && hasSymbol) {
    return {
      score: 2,
      label: "Medium Password",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      percent: 66,
      checks,
      isValid: true,
    }
  }

  // Weak: Missing length, symbols, letters, or numbers
  return {
    score: 1,
    label: "Weak Password",
    color: "#ef4444",
    bgColor: "#fef2f2",
    percent: 33,
    checks,
    isValid: false,
  }
}

const getPasswordSuggestionText = (pwd) => {
  if (!pwd) {
    return "💡 A strong password must include 8+ characters, uppercase & lowercase letters, numbers, and symbols."
  }
  const str = getPasswordStrength(pwd)
  if (!str.checks.length) {
    return `💡 Weak: Add at least ${8 - pwd.length} more character(s) to reach minimum 8 characters.`
  }
  if (!str.checks.hasAnyLetter) {
    return "💡 Weak: Must include letters (a-z or A-Z)."
  }
  if (!str.checks.numbers) {
    return "💡 Weak: Must include at least one numeric digit (0-9)."
  }
  if (!str.checks.symbols) {
    return "💡 Weak: Must include at least one special symbol (!@#$%^&*)."
  }
  if (!str.checks.letters) {
    return "💡 Medium: Add uppercase letters (A-Z) along with lowercase to make it Strong."
  }
  return "✓ Strong password! Contains characters, numbers, and symbols."
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [suggestedNotice, setSuggestedNotice] = useState("")
  const [receivedOtp, setReceivedOtp] = useState("")

  const handleSuggestPassword = () => {
    const strong = generateStrongPassword()
    setFormData((prev) => ({
      ...prev,
      password: strong,
      confirmPassword: strong,
    }))
    setShowPassword(true)
    setShowConfirmPassword(true)
    setSuggestedNotice("✨ Strong password generated and auto-filled! You can copy and save it.")
    setTimeout(() => setSuggestedNotice(""), 6000)
  }

  const handleCopyPassword = () => {
    if (!formData.password) return
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(formData.password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

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
    if (!pwdStrength.checks.length || !pwdStrength.checks.hasAnyLetter || !pwdStrength.checks.numbers || !pwdStrength.checks.symbols) {
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
      if (response.data.debugOtp) {
        setReceivedOtp(response.data.debugOtp)
      }
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
      if (response.data.debugOtp) {
        setReceivedOtp(response.data.debugOtp)
      }
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label
                      style={{
                        color: "#333",
                        fontWeight: "500",
                        fontSize: "14px",
                        margin: 0,
                      }}
                    >
                      Password <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggestPassword}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#4f46e5",
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        borderRadius: "6px",
                        padding: "4px 9px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      title="Generate a secure strong password that meets all requirements"
                    >
                      <Sparkles size={13} color="#4f46e5" />
                      Suggest Strong Password
                    </button>
                  </div>

                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      style={{
                        width: "100%",
                        padding: "12px 75px 12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: showPassword ? "monospace" : "inherit",
                        letterSpacing: showPassword ? "1px" : "normal",
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
                    <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {formData.password && (
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: copiedPassword ? "#10b981" : "#64748b" }}
                          title={copiedPassword ? "Copied!" : "Copy password"}
                        >
                          {copiedPassword ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#64748b" }}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {suggestedNotice && (
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#4338ca", background: "#e0e7ff", padding: "6px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{suggestedNotice}</span>
                    </div>
                  )}

                  {(() => {
                    const str = getPasswordStrength(formData.password)
                    return (
                      <div style={{ marginTop: "10px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Password Strength:</span>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              color: str.color,
                              background: str.bgColor,
                              border: `1px solid ${str.color}33`,
                            }}
                          >
                            {str.label}
                          </span>
                        </div>
                        {/* 3-tier Segmented Strength Bar */}
                        <div style={{ display: "flex", gap: "6px", height: "10px", width: "100%", marginBottom: "10px" }}>
                          <div
                            style={{
                              flex: 1,
                              height: "100%",
                              borderRadius: "4px",
                              border: `1px solid ${str.score >= 1 ? (str.score === 1 ? "#ef4444" : str.score === 2 ? "#f59e0b" : "#10b981") : "#cbd5e1"}`,
                              background: str.score >= 1 ? (str.score === 1 ? "#ef4444" : str.score === 2 ? "#f59e0b" : "#10b981") : "#e2e8f0",
                              transition: "all 0.3s ease",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "100%",
                              borderRadius: "4px",
                              border: `1px solid ${str.score >= 2 ? (str.score === 2 ? "#f59e0b" : "#10b981") : "#cbd5e1"}`,
                              background: str.score >= 2 ? (str.score === 2 ? "#f59e0b" : "#10b981") : "#e2e8f0",
                              transition: "all 0.3s ease",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "100%",
                              borderRadius: "4px",
                              border: `1px solid ${str.score >= 3 ? "#10b981" : "#cbd5e1"}`,
                              background: str.score >= 3 ? "#10b981" : "#e2e8f0",
                              transition: "all 0.3s ease",
                            }}
                          />
                        </div>
                        {/* Live Checklist */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: str.checks.length ? "#10b981" : "#64748b" }}>
                            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{str.checks.length ? "✓" : "○"}</span>
                            <span>8+ Characters</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: str.checks.letters ? "#10b981" : "#64748b" }}>
                            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{str.checks.letters ? "✓" : "○"}</span>
                            <span>Upper & Lower Letters</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: str.checks.numbers ? "#10b981" : "#64748b" }}>
                            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{str.checks.numbers ? "✓" : "○"}</span>
                            <span>Numbers (0-9)</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: str.checks.symbols ? "#10b981" : "#64748b" }}>
                            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{str.checks.symbols ? "✓" : "○"}</span>
                            <span>Symbols (!@#$...)</span>
                          </div>
                        </div>
                        {/* Real-time Guidance / Suggestion */}
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            color: str.score === 3 ? "#059669" : "#64748b",
                            background: str.score === 3 ? "#ecfdf5" : "#ffffff",
                            padding: "6px 8px",
                            borderRadius: "4px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {getPasswordSuggestionText(formData.password)}
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
                    Confirm Password <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      style={{
                        width: "100%",
                        padding: "12px 42px 12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: showConfirmPassword ? "monospace" : "inherit",
                        letterSpacing: showConfirmPassword ? "1px" : "normal",
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
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#64748b" }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: "600", color: formData.password === formData.confirmPassword ? "#10b981" : "#ef4444" }}>
                      {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </div>
                  )}
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
                  {receivedOtp && (
                    <div style={{ marginTop: "10px", padding: "10px 14px", background: "#f0fdf4", border: "1px dashed #22c55e", borderRadius: "8px", textAlign: "center" }}>
                      <span style={{ fontSize: "12.5px", color: "#166534" }}>Verification code: <strong>{receivedOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtp(receivedOtp)}
                        style={{ marginLeft: "10px", fontSize: "12px", color: "#15803d", fontWeight: "700", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                      >
                        Auto-fill Code
                      </button>
                    </div>
                  )}
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

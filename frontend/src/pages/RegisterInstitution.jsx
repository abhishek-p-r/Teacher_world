"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { Sparkles, Eye, EyeOff, Copy, Check } from "lucide-react"

import { API_URL, BASE_URL } from "../config/api"

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

const getPasswordSuggestionText = (pwd) => {
  if (!pwd) {
    return "💡 Tip: Click 'Suggest Strong Password' for an instant secure code, or include letters, numbers & symbols."
  }
  const str = getPasswordStrength(pwd)
  if (!str.checks.length) {
    return `💡 Suggestion: Add at least ${8 - pwd.length} more character(s) to reach minimum 8 characters.`
  }
  if (!str.checks.letters) {
    return "💡 Suggestion: Include at least one letter (a-z or A-Z)."
  }
  if (!str.checks.numbers) {
    return "💡 Suggestion: Include at least one numeric digit (0-9)."
  }
  if (!str.checks.symbols) {
    return "💡 Suggestion: Include at least one special symbol (!@#$%^&*)."
  }
  if (str.score === 2) {
    return "💡 Suggestion: Add an uppercase letter or make it 10+ characters to achieve a Strong rating."
  }
  return "✓ Excellent! Strong, high-security password."
}

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

export default function RegisterInstitution() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    institutionName: "",
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

    if (!formData.institutionName.trim()) {
      setError("Please enter your institution name")
      return
    }

    if (!formData.name.trim()) {
      setError("Please enter the contact person's name")
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
        institutionName: formData.institutionName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      let response
      try {
        response = await axios.post(`${API_URL}/auth/register-institution`, payload)
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          try {
            response = await axios.post(`${API_URL}/auth/register/institution`, payload)
          } catch (retryErr1) {
            if (retryErr1.response?.status === 404) {
              try {
                response = await axios.post(`${API_URL}/register-institution`, payload)
              } catch (retryErr2) {
                if (retryErr2.response?.status === 404) {
                  response = await axios.post(`${BASE_URL}/register-institution`, payload)
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

      setOtp("")
      setSuccessMessage("A 6-digit verification code has been sent to your email. Please check your inbox and spam folder.")
      setCurrentStep(2)
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setError("Network Error: Cannot connect to the server (https://teacher-world.onrender.com). Please verify your internet connection or check backend status.")
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || "Invalid input. Please check your details.")
      } else if (err.response?.status === 404) {
        setError(err.response.data?.message || "Registration service temporarily unavailable (404). Please try again or check backend connection.")
      } else if (err.response?.status === 409) {
        setError(err.response.data?.message || "Email already registered. Please login instead.")
      } else if (err.response?.status === 429) {
        setError(err.response.data?.message || "Too many OTP requests. Please wait a while before trying again.")
      } else if (err.response?.status === 500) {
        setError(err.response.data?.message || "Server error. Please try again later.")
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError("Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const otpPayload = {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim(),
        name: formData.name.trim(),
        password: formData.password,
        institutionName: formData.institutionName.trim(),
        role: "institution",
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

      localStorage.setItem("accessToken", response.data.accessToken)
      localStorage.setItem("refreshToken", response.data.refreshToken)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      setSuccessMessage("Registration successful! Redirecting...")
      setTimeout(() => {
        navigate("/dashboard/institution")
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed. Please try again.")
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
        background: "linear-gradient(135deg, #2d5016 0%, #1a3a0a 100%)",
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
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", margin: 0 }}>For Institutions</p>
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
                borderBottom: currentStep === 1 ? "3px solid #2d5016" : "none",
                color: currentStep === 1 ? "#2d5016" : "#999",
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
                borderBottom: currentStep === 2 ? "3px solid #2d5016" : "none",
                color: currentStep === 2 ? "#2d5016" : "#999",
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
              {currentStep === 1 ? "Register Your Institution" : "Verify Your Email"}
            </h2>
            <p style={{ marginBottom: "30px", color: "#666", fontSize: "14px" }}>
              {currentStep === 1 ? "Post jobs and manage applications" : "Enter the OTP sent to your email"}
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
                    Institution Name
                  </label>
                  <input
                    type="text"
                    name="institutionName"
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
                    value={formData.institutionName}
                    onChange={handleChange}
                    onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="ABC School of Excellence"
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
                    Contact Person Name
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
                    onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="John Manager"
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
                    onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="admin@institution.com"
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
                        color: "#2d5016",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "6px",
                        padding: "4px 9px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      title="Generate a secure strong password that meets all requirements"
                    >
                      <Sparkles size={13} color="#2d5016" />
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
                      onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
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
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#166534", background: "#dcfce7", padding: "6px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{suggestedNotice}</span>
                    </div>
                  )}

                  {formData.password ? (() => {
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
                        <div style={{ marginTop: "8px", fontSize: "11.5px", color: str.score === 3 ? "#059669" : "#475569", background: str.score === 3 ? "#ecfdf5" : "#f8fafc", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          {getPasswordSuggestionText(formData.password)}
                        </div>
                      </div>
                    )
                  })() : (
                    <div style={{ marginTop: "6px", fontSize: "11.5px", color: "#64748b" }}>
                      💡 Tip: Click <strong>"Suggest Strong Password"</strong> above for an instant high-security password.
                    </div>
                  )}
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
                      onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
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
                    background: loading ? "#999" : "#2d5016",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.3s",
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.background = "#1a3a0a")}
                  onMouseLeave={(e) => !loading && (e.target.style.background = "#2d5016")}
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
                    onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
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
                    background: loading || otp.length !== 6 ? "#ccc" : "#2d5016",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                    transition: "background 0.3s",
                  }}
                  onMouseEnter={(e) => !loading && otp.length === 6 && (e.target.style.background = "#1a3a0a")}
                  onMouseLeave={(e) => !loading && otp.length === 6 && (e.target.style.background = "#2d5016")}
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
                      background: "#f0f5ed",
                      color: "#2d5016",
                      border: "2px solid #2d5016",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.background = "#e2ecd9")}
                    onMouseLeave={(e) => !loading && (e.target.style.background = "#f0f5ed")}
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
            <Link to="/login-institution" style={{ color: "white", textDecoration: "underline", fontWeight: "600" }}>
              Login here
            </Link>
          </p>
          <p style={{ fontSize: "12px", marginTop: "10px", opacity: 0.9 }}>
            Or register as a{" "}
            <Link to="/register-teacher" style={{ color: "white", textDecoration: "underline", fontWeight: "600" }}>
              Teacher
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

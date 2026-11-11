"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

import { API_URL, BASE_URL } from "../config/api"

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        institutionName: formData.institutionName,
        email: formData.email,
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

      setSuccessMessage("OTP sent to your email! Check your inbox.")
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
        email: formData.email,
        otp,
        name: formData.name,
        password: formData.password,
        institutionName: formData.institutionName,
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
      setSuccessMessage(response.data.message || `A fresh 6-digit OTP has been sent to ${formData.email}!`)
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
                    onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                    required
                    placeholder="At least 6 characters"
                  />
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
                    onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
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
                    placeholder="000000"
                  />
                  <p style={{ textAlign: "center", color: "#666", fontSize: "12px", marginTop: "8px" }}>
                    Check your email: {formData.email}
                  </p>
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

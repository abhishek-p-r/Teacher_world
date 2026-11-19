"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import Logo from "../components/Logo"

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "#cbd5e1", percent: 0, checks: { length: false, letters: false, numbers: false, symbols: false } }
  const hasMinLength = pwd.length >= 8
  const hasLetter = /[a-zA-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)
  const hasUpperLower = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd)
  const isLong = pwd.length >= 10
  const checks = { length: hasMinLength, letters: hasLetter, numbers: hasNumber, symbols: hasSymbol }
  const allMandatory = hasMinLength && hasLetter && hasNumber && hasSymbol
  if (allMandatory && (hasUpperLower || isLong)) {
    return { score: 3, label: "Strong", color: "#10b981", percent: 100, checks }
  } else if (allMandatory) {
    return { score: 2, label: "Medium", color: "#f59e0b", percent: 66, checks }
  } else {
    return { score: 1, label: "Weak", color: "#ef4444", percent: 33, checks }
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (response.ok) {
        setMessage("OTP sent to your email")
        setStep(2)
      } else {
        setMessage("Email not found")
      }
    } catch (error) {
      setMessage("Error requesting OTP")
    }
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    const str = getPasswordStrength(newPassword)
    if (!str.checks.length || !str.checks.letters || !str.checks.numbers || !str.checks.symbols) {
      setMessage("Password must be at least 8 characters long and contain letters, numbers, and special symbols (!@#$...).")
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      })
      if (response.ok) {
        setMessage("Password reset successful!")
        setTimeout(() => navigate("/login-teacher"), 2000)
      } else {
        setMessage("Invalid OTP or error resetting password")
      }
    } catch (error) {
      setMessage("Error resetting password")
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
          <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Reset Password</h2>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 8 chars with letters, numbers & symbols"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                  }}
                />
                {newPassword && (() => {
                  const str = getPasswordStrength(newPassword)
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
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {message && (
            <p
              style={{
                marginTop: "1rem",
                textAlign: "center",
                color: message.includes("successful") ? "#10b981" : "#ef4444",
              }}
            >
              {message}
            </p>
          )}

          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link to="/login-teacher" style={{ color: "#1a5490", textDecoration: "none" }}>
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../config/api"

export default function VerifyOTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const email = sessionStorage.getItem("tempEmail")
      const tempData = JSON.parse(sessionStorage.getItem("tempData"))

      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp,
        tempData,
      })

      // Store tokens
      localStorage.setItem("accessToken", response.data.accessToken)
      localStorage.setItem("refreshToken", response.data.refreshToken)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      // Clear temp data
      sessionStorage.removeItem("tempEmail")
      sessionStorage.removeItem("tempData")

      // Redirect
      navigate(response.data.user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/institution")
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center" }}>
      <div className="container">
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <div className="card">
            <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Verify Email</h2>
            <p style={{ textAlign: "center", marginBottom: "2rem", color: "#666" }}>
              Enter the 6-digit OTP sent to your email
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>OTP</label>
                <input
                  type="text"
                  className="form-control"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength="6"
                  style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem", fontWeight: "bold" }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

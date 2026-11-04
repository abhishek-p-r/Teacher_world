"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, TrendingUp, Eye, CheckCircle, AlertCircle } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL } from "../config/api"

export default function TeacherAnalytics() {
  const [analytics, setAnalytics] = useState({
    profileViews: 143,
    profileScore: 78,
    jobMatchPercentage: 85,
    improvementTips: [
      "Add more skills to improve match percentage",
      "Upload a professional photo",
      "Complete your certifications section",
    ],
  })
  const [token] = useState(localStorage.getItem("accessToken"))

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAnalytics(response.data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand">
            <Logo />
          </Link>
          <Link to="/dashboard/teacher" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

  <section style={{ padding: "2rem 0", background: "var(--gray-50)", minHeight: "100vh" }}>
        <div className="container">
          <h1 style={{ marginBottom: "2rem" }}>Your Analytics & Insights</h1>

          {/* Stats Cards */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}
          >
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>Profile Views</p>
                  <h2 style={{ margin: "0.5rem 0" }}>{analytics.profileViews}</h2>
                  <p style={{ color: "#27ae60", fontSize: "0.875rem" }}>+12% this month</p>
                </div>
                <Eye size={40} style={{ color: "#1a5490", opacity: 0.2 }} />
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>Profile Score</p>
                  <h2 style={{ margin: "0.5rem 0" }}>{analytics.profileScore}%</h2>
                  <p style={{ color: "#f39c12", fontSize: "0.875rem" }}>Good</p>
                </div>
                <CheckCircle size={40} style={{ color: "#27ae60", opacity: 0.2 }} />
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>Job Match %</p>
                  <h2 style={{ margin: "0.5rem 0" }}>{analytics.jobMatchPercentage}%</h2>
                  <p style={{ color: "#27ae60", fontSize: "0.875rem" }}>Excellent</p>
                </div>
                <TrendingUp size={40} style={{ color: "#27ae60", opacity: 0.2 }} />
              </div>
            </div>
          </div>

          {/* Improvement Tips */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <AlertCircle style={{ color: "#f39c12" }} />
              <h3>Tips to Improve Your Profile</h3>
            </div>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {analytics.improvementTips.map((tip, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: "0.75rem 0",
                    borderBottom: idx < analytics.improvementTips.length - 1 ? "1px solid #e0e0e0" : "none",
                  }}
                >
                  <p style={{ margin: 0, color: "#333" }}>✓ {tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

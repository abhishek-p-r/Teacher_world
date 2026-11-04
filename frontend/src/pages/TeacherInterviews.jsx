"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL, BASE_URL } from "../config/api"

const normalizeUrl = (url) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("/")) return `${BASE_URL}${url}`
  return `${BASE_URL}/${url}`
}

export default function TeacherInterviews() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const token = localStorage.getItem("accessToken")
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }
    fetchInterviews()
  }, [token])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/interviews`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInterviews(response.data || [])
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch interviews"
      setError(message)
      console.error("Interviews fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f39c12",
      accepted: "#27ae60",
      rejected: "#e74c3c",
      rescheduled: "#9b59b6",
      completed: "#2ecc71",
      cancelled: "#e74c3c",
    }
    return colors[status] || "#666"
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      rescheduled: "Rescheduled",
      completed: "Completed",
      cancelled: "Cancelled",
    }
    return labels[status] || status
  }

  const isLiveInterview = (scheduledDate) => {
    const now = new Date()
    const interviewTime = new Date(scheduledDate)
    const timeDiff = Math.abs(now - interviewTime)
    // Consider live if within 30 minutes before or after
    return timeDiff <= 30 * 60 * 1000
  }

  const liveInterviews = interviews.filter(interview => isLiveInterview(interview.scheduledDate) && interview.status === 'accepted')
  const upcomingInterviews = interviews.filter(interview => !isLiveInterview(interview.scheduledDate) || interview.status !== 'accepted')

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <div className="flex gap-2">
            <Link to="/teacher/dashboard" className="btn btn-primary btn-sm">
              Back to Dashboard
            </Link>
            <Link to="/jobs" className="btn btn-secondary btn-sm">
              Browse Jobs
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("accessToken")
                localStorage.removeItem("user")
                localStorage.removeItem("teacherProfile")
                navigate("/login")
              }}
              className="btn btn-secondary btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <section style={{ padding: "2rem 0", background: "#f8f9fa", minHeight: "calc(100vh - 80px)" }}>
        <div className="container">
          <h1 style={{ marginBottom: "1rem", color: "#333" }}>My Interviews</h1>
          <p style={{ color: "#666", marginBottom: "2rem" }}>
            View and manage your scheduled interviews with institutions.
          </p>

          <>
            {/* Live Interview Section */}
            {liveInterviews.length > 0 && (
              <div className="card" style={{ background: "#fff3cd", border: "1px solid #ffeaa7", marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#856404", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  🔴 Live Interview Section
                </h3>
                <p style={{ color: "#856404", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  You have interviews starting soon or currently in progress. Join your live meetings below.
                </p>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}
                >
                  {liveInterviews.map((interview) => (
                    <div key={interview._id} className="card" style={{ background: "white", border: "2px solid #dc3545" }}>
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                          <h4 style={{ margin: "0", color: "#333", fontSize: "1.1rem" }}>
                            Live Interview with {interview.institution?.institutionName || "Institution"}
                          </h4>
                          <span
                            style={{
                              background: "#dc3545",
                              color: "white",
                              padding: "0.375rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              textTransform: "capitalize",
                              animation: "pulse 2s infinite",
                            }}
                          >
                            LIVE
                          </span>
                        </div>
                        <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                          Position: {interview.position || "Not specified"}
                        </p>
                        <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                          Scheduled: {new Date(interview.scheduledDate).toLocaleString()}
                        </p>
                        {interview.interviewerName && (
                          <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                            Interviewer: {interview.interviewerName}
                          </p>
                        )}
                      </div>

                      {interview.notes && (
                        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f8f9fa", borderRadius: "0.5rem" }}>
                          <p style={{ color: "#666", fontSize: "0.875rem", margin: "0", fontStyle: "italic" }}>
                            Notes: {interview.notes}
                          </p>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {interview.zoomJoinUrl && (
                          <a
                            href={interview.zoomJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ fontSize: "0.875rem", flex: 1, textAlign: "center", background: "#dc3545", borderColor: "#dc3545" }}
                          >
                            Join Live Meeting
                          </a>
                        )}
                        {interview.recordingUrl && (
                          <a
                            href={normalizeUrl(interview.recordingUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ fontSize: "0.875rem", flex: 1, textAlign: "center" }}
                          >
                            View Recording
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="card text-center" style={{ background: "white", padding: "3rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 2s infinite" }}>🎥</div>
                <p style={{ color: "#666" }}>Loading interviews...</p>
              </div>
            )}

            {error && (
              <div className="card text-center" style={{ background: "white", padding: "3rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>{error}</p>
                <button onClick={fetchInterviews} className="btn btn-primary">
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && liveInterviews.length === 0 && upcomingInterviews.length === 0 && (
              <div className="card text-center" style={{ background: "white", padding: "3rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎥</div>
                <h3 style={{ marginBottom: "1rem", color: "#333" }}>No Interviews Scheduled</h3>
                <p style={{ color: "#666", marginBottom: "2rem" }}>
                  You don't have any interviews scheduled at the moment. Keep applying to jobs to get interview opportunities!
                </p>
                <Link to="/jobs" className="btn btn-primary">
                  Browse Jobs
                </Link>
              </div>
            )}

            {!loading && !error && upcomingInterviews.length > 0 && (
              <div>
                <h3 style={{ marginBottom: "1rem", color: "#333" }}>Upcoming Interviews</h3>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}
                >
                  {upcomingInterviews.map((interview) => (
                    <div key={interview._id} className="card" style={{ background: "white" }}>
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                          <h4 style={{ margin: "0", color: "#333", fontSize: "1.1rem" }}>
                            Interview with {interview.institution?.institutionName || "Institution"}
                          </h4>
                          <span
                            style={{
                              background: getStatusColor(interview.status),
                              color: "white",
                              padding: "0.375rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              textTransform: "capitalize",
                            }}
                          >
                            {getStatusLabel(interview.status)}
                          </span>
                        </div>
                        <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                          Position: {interview.position || "Not specified"}
                        </p>
                        <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                          Scheduled: {new Date(interview.scheduledDate).toLocaleString()}
                        </p>
                        {interview.interviewerName && (
                          <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                            Interviewer: {interview.interviewerName}
                          </p>
                        )}
                      </div>

                      {interview.notes && (
                        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f8f9fa", borderRadius: "0.5rem" }}>
                          <p style={{ color: "#666", fontSize: "0.875rem", margin: "0", fontStyle: "italic" }}>
                            Notes: {interview.notes}
                          </p>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {interview.zoomJoinUrl && interview.status === "accepted" && (
                          <a
                            href={interview.zoomJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ fontSize: "0.875rem", flex: 1, textAlign: "center" }}
                          >
                            Join Meeting
                          </a>
                        )}
                        {interview.recordingUrl && (
                          <a
                            href={normalizeUrl(interview.recordingUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ fontSize: "0.875rem", flex: 1, textAlign: "center" }}
                          >
                            View Recording
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        </div>
      </section>
    </div>
  )
}

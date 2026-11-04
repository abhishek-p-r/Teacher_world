"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import axios from "axios"
import io from "socket.io-client"

import { API_URL, BASE_URL } from "../config/api"

export default function TeacherApplications() {
  const [applications, setApplications] = useState([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [editingApp, setEditingApp] = useState(null)
  const [editCoverLetter, setEditCoverLetter] = useState("")
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    fetchApplications()

    // Initialize socket connection
    const newSocket = io(BASE_URL, {
      auth: { token }
    })

    newSocket.on("connect", () => {
      console.log("Connected to socket server")
      newSocket.emit("join", localStorage.getItem("userId"))
    })

    newSocket.on("application_status_updated", (data) => {
      console.log("Application status updated:", data)
      // Refresh applications to show updated status
      fetchApplications()
    })

    setSocket(newSocket)

    return () => {
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_URL}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApplications(response.data || [])
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditApplication = (app) => {
    setEditingApp(app._id)
    setEditCoverLetter(app.coverLetter || "")
  }

  const handleUpdateApplication = async () => {
    try {
      await axios.put(`${API_URL}/applications/${editingApp}`, {
        coverLetter: editCoverLetter
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingApp(null)
      setEditCoverLetter("")
      fetchApplications()
    } catch (error) {
      console.error("Failed to update application:", error)
      alert("Failed to update application")
    }
  }

  const handleDeleteApplication = async (appId) => {
    if (!confirm("Are you sure you want to delete this application?")) return

    try {
      await axios.delete(`${API_URL}/applications/${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchApplications()
    } catch (error) {
      console.error("Failed to delete application:", error)
      alert("Failed to delete application")
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      applied: "#f59e0b",
      shortlisted: "#10b981",
      rejected: "#ef4444",
      "under-review": "#3b82f6",
      accepted: "#8b5cf6",
    }
    return colors[status] || "#666"
  }

  const filteredApps = filterStatus === "all" ? applications : applications.filter((app) => app.status === filterStatus)

  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand">
            TeacherWorld
          </Link>
          <Link to="/dashboard/teacher" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

      <section style={{ padding: "2rem 0", background: "var(--gray-50)", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <h1 style={{ marginBottom: "2rem" }}>Your Applications</h1>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            {["all", "applied", "under-review", "shortlisted", "accepted", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "2px solid #e0e0e0",
                  background: filterStatus === status ? "#1a5490" : "white",
                  color: filterStatus === status ? "white" : "#666",
                  cursor: "pointer",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  textTransform: "capitalize",
                  borderColor: filterStatus === status ? "#1a5490" : "#e0e0e0",
                }}
              >
                {status === "all" ? "All" : status} ({filterStatus === status ? filteredApps.length : "..."})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="card text-center">Loading applications...</div>
          ) : filteredApps.length === 0 ? (
            <div className="card text-center">
              <p>No applications found</p>
            </div>
          ) : (
            <div className="grid">
              {filteredApps.map((app) => (
                <div key={app._id} className="card">
                  {editingApp === app._id ? (
                    <div>
                      <h3>Edit Application</h3>
                      <p style={{ color: "#666", marginBottom: "1rem" }}>
                        {app.jobId?.title} at {app.jobId?.institutionId?.institutionName}
                      </p>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                          Cover Letter
                        </label>
                        <textarea
                          value={editCoverLetter}
                          onChange={(e) => setEditCoverLetter(e.target.value)}
                          rows={4}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid #ccc",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                          }}
                          placeholder="Update your cover letter..."
                        />
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={handleUpdateApplication}
                          className="btn btn-primary btn-sm"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingApp(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "1rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {app.jobId?.institutionId?.photo && (
                            <img
                              src={`${API_URL.replace('/api', '')}${app.jobId.institutionId.photo}`}
                              alt={app.jobId?.institutionId?.institutionName}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          )}
                          <div>
                            <h3>{app.jobId?.title}</h3>
                            <p style={{ color: "#666", marginBottom: "0.5rem" }}>
                              {app.jobId?.institutionId?.institutionName}
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            background: getStatusColor(app.status),
                            color: "white",
                            padding: "0.375rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            textTransform: "capitalize",
                          }}
                        >
                          {app.status}
                        </span>
                      </div>

                      {/* Cover Letter Preview */}
                      {app.coverLetter && (
                        <div style={{ marginBottom: "1rem" }}>
                          <p style={{ fontSize: "0.875rem", color: "#666", fontStyle: "italic" }}>
                            "{app.coverLetter.length > 100 ? `${app.coverLetter.substring(0, 100)}...` : app.coverLetter}"
                          </p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div style={{ margin: "1.5rem 0", paddingLeft: "1rem", borderLeft: "3px solid #e0e0e0" }}>
                        <div style={{ marginBottom: "1rem" }}>
                          <p style={{ fontSize: "0.875rem", color: "#999" }}>
                            Applied on {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "#666" }}>
                          Last updated: {new Date(app.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <Link to={`/jobs/${app.jobId?._id}`} className="btn btn-primary btn-sm">
                          View Job
                        </Link>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {app.status === "applied" && (
                            <button
                              onClick={() => handleEditApplication(app)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "0.375rem 0.75rem" }}
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteApplication(app._id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: "0.375rem 0.75rem" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


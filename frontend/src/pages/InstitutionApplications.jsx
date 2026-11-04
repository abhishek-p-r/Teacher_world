"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Filter, Download, Mail, Eye, Edit, Trash2, X, CheckCircle, Clock, UserCheck, Calendar, Award, XCircle } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL, BASE_URL } from "../config/api"

export default function InstitutionApplications() {
  const [applications, setApplications] = useState([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [token] = useState(localStorage.getItem("accessToken"))
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [messageContent, setMessageContent] = useState("")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedApplicationForProfile, setSelectedApplicationForProfile] = useState(null)
  const [teacherProfile, setTeacherProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_URL}/applications/institution/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApplications(response.data)
    } catch (error) {
      console.error("Failed to fetch applications:", error)
      alert("Failed to fetch applications: Network Error")
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications =
    filterStatus === "all" ? applications : applications.filter((app) => app.status === filterStatus)

  const getStatusColor = (status) => {
    const colors = {
      shortlisted: "#27ae60",
      viewed: "#f39c12",
      "interview-scheduled": "#1a5490",
      rejected: "#e74c3c",
      applied: "#3498db",
      accepted: "#2ecc71",
    }
    return colors[status] || "#999"
  }

  const getStatusLabel = (status) => {
    const labels = {
      applied: "Applied",
      viewed: "Viewed",
      shortlisted: "Shortlisted",
      "interview-scheduled": "Interview Scheduled",
      accepted: "Accepted",
      rejected: "Rejected",
    }
    return labels[status] || status
  }

  const getStatusIcon = (status) => {
    const icons = {
      applied: <Clock size={16} />,
      viewed: <Eye size={16} />,
      shortlisted: <UserCheck size={16} />,
      "interview-scheduled": <Calendar size={16} />,
      accepted: <CheckCircle size={16} />,
      rejected: <XCircle size={16} />,
    }
    return icons[status] || <Clock size={16} />
  }

  const handleViewResume = (application) => {
    // If we have the complete profile data, use that
    if (teacherProfile?.resumeUrl) {
      window.open(`${API_URL.replace('/api', '')}${teacherProfile.resumeUrl}`, '_blank')
    } else if (application.teacherId?.resumeUrl) {
      // Fallback to basic application data
      window.open(`${BASE_URL}/uploads/resumes/${application.teacherId.resumeUrl}`, '_blank')
    } else {
      alert("Resume not available for this applicant")
    }
  }

  const handleViewProfile = async (application) => {
    setSelectedApplicationForProfile(application)
    setProfileLoading(true)
    setShowProfileModal(true)

    try {
      const teacherUserId = application.teacherId?.userId
      if (!teacherUserId) {
        throw new Error("Teacher userId not found in application data")
      }

      const response = await axios.get(`${API_URL}/profile/teacher/${teacherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTeacherProfile(response.data)
    } catch (error) {
      console.error("Failed to fetch teacher profile:", error)
      alert(`Failed to load teacher profile details: ${error.message}`)
      setTeacherProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleEditApplication = (app) => {
    setSelectedApplication(app)
    setNewStatus(app.status)
    setStatusNotes("")
    setShowStatusModal(true)
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === selectedApplication.status) {
      setShowStatusModal(false)
      return
    }

    try {
      const response = await axios.patch(`${API_URL}/applications/${selectedApplication._id}`, {
        status: newStatus,
        notes: statusNotes || `Status updated to ${getStatusLabel(newStatus)}`
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log('Status update response:', response.data)
      fetchApplications()
      setShowStatusModal(false)
      alert(`Status updated to ${getStatusLabel(newStatus)}`)
    } catch (error) {
      console.error("Failed to update status:", error.response?.data || error.message)
      alert(`Failed to update status: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleDeleteApplication = async (appId) => {
    if (!confirm("Are you sure you want to delete this application?")) return

    try {
      await axios.delete(`${API_URL}/applications/institution/${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchApplications()
    } catch (error) {
      console.error("Failed to delete application:", error)
      alert("Failed to delete application: Network Error")
    }
  }

  const handleSendMessage = (app) => {
    setSelectedApplication(app)
    setSelectedTeacher(app.teacherId)
    setMessageContent("")
    setShowMessageModal(true)
  }

  const handleSendMessageSubmit = async () => {
    if (!messageContent.trim()) {
      alert("Please enter a message")
      return
    }

    try {
      await axios.post(`${API_URL}/messages`, {
        receiverId: selectedTeacher.userId,
        content: messageContent,
        applicationId: selectedApplication._id
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      alert("Message sent successfully!")
      setShowMessageModal(false)
      setMessageContent("")
    } catch (error) {
      console.error("Failed to send message:", error.response?.data || error.message)
      alert(`Failed to send message: ${error.response?.data?.message || error.message}`)
    }
  }

  const validStatuses = [
    { value: "applied", label: "Applied", icon: <Clock size={16} />, description: "New application received" },
    { value: "viewed", label: "Viewed", icon: <Eye size={16} />, description: "Application has been reviewed" },
    { value: "shortlisted", label: "Shortlisted", icon: <UserCheck size={16} />, description: "Candidate selected for further consideration" },
    { value: "interview-scheduled", label: "Interview Scheduled", icon: <Calendar size={16} />, description: "Interview has been arranged" },
    { value: "accepted", label: "Accepted", icon: <CheckCircle size={16} />, description: "Application accepted - offer made" },
    { value: "rejected", label: "Rejected", icon: <XCircle size={16} />, description: "Application rejected" },
  ]

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading applications...
      </div>
    )
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <Link to="/dashboard/institution" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

      <section style={{ padding: "2rem 0", background: "var(--gray-50)", minHeight: "100vh" }}>
        <div className="container">
          <h1 style={{ marginBottom: "1rem" }}>Application Management System</h1>
          <p style={{ marginBottom: "2rem", color: "#666", fontSize: "1.1rem" }}>
            Manage teacher applications for your job postings. Update statuses to track progress and communicate with candidates.
          </p>

          {/* Workflow Guide */}
          <div className="card" style={{ marginBottom: "2rem", background: "#f8f9fa", border: "1px solid #dee2e6" }}>
            <h3 style={{ marginBottom: "1rem", color: "#1a5490" }}>📋 Application Workflow:</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {validStatuses.map((status, index) => (
                <div key={status.value} style={{
                  padding: "1rem",
                  background: "white",
                  borderRadius: "0.5rem",
                  border: "1px solid #e9ecef",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <div style={{
                    color: getStatusColor(status.value),
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {status.icon}
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>{status.label}</strong>
                    <p style={{ fontSize: "0.8rem", color: "#666", margin: "0.25rem 0 0 0" }}>
                      {status.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", padding: "1rem", background: "#e8f4fd", borderRadius: "0.25rem" }}>
              <strong>💡 How to use:</strong>
              <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
                <li>Click the <Edit size={14} style={{ display: "inline" }} /> button to update application status</li>
                <li>Teachers receive email notifications when status changes</li>
                <li>Use filters to view applications by status</li>
                <li>Click <Eye size={14} style={{ display: "inline" }} /> to view resumes</li>
              </ul>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Quick Stats</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              {validStatuses.map(status => (
                <div key={status.value} style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "0.5rem",
                  border: `2px solid ${getStatusColor(status.value)}`
                }}>
                  <div style={{ color: getStatusColor(status.value), marginBottom: "0.5rem" }}>
                    {status.icon}
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: getStatusColor(status.value) }}>
                    {applications.filter(app => app.status === status.value).length}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>{status.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div
            className="card"
            style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}
          >
            <Filter size={20} />
            <button
              onClick={() => setFilterStatus("all")}
              style={{
                padding: "0.5rem 1rem",
                background: filterStatus === "all" ? "#1a5490" : "#e0e0e0",
                color: filterStatus === "all" ? "white" : "black",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              All Applications ({applications.length})
            </button>
            {validStatuses.map(status => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                style={{
                  padding: "0.5rem 1rem",
                  background: filterStatus === status.value ? getStatusColor(status.value) : "#e0e0e0",
                  color: filterStatus === status.value ? "white" : "black",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {status.icon}
                {status.label} ({applications.filter(app => app.status === status.value).length})
              </button>
            ))}
          </div>

          {/* Applications Table */}
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Teacher Details</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Experience</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Applied Date</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app._id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {app.teacherId?.photo ? (
                          <img
                            src={`${BASE_URL}${app.teacherId.photo}`}
                            alt={app.teacherId?.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: "#e0e0e0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              color: "#666",
                            }}
                          >
                            {app.teacherId?.name?.charAt(0)?.toUpperCase() || "T"}
                          </div>
                        )}
                        <div>
                          <strong>{app.teacherId?.name || "N/A"}</strong>
                          <p style={{ fontSize: "0.875rem", color: "#666", margin: "0.25rem 0 0 0" }}>
                            {app.jobId?.title || "N/A"} - {app.jobId?.subject || ""}
                          </p>
                          <p style={{ fontSize: "0.8rem", color: "#888", margin: "0.25rem 0 0 0" }}>
                            {app.teacherId?.subjects?.join(", ") || "No subjects listed"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>{app.teacherId?.experience || "N/A"} years</td>
                    <td style={{ padding: "1rem" }}>{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          background: getStatusColor(app.status),
                          color: "white",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        {getStatusIcon(app.status)}
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleViewProfile(app)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#1a5490",
                          marginRight: "0.5rem",
                        }}
                        title="View Profile & Resume"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEditApplication(app)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#27ae60",
                          marginRight: "0.5rem",
                        }}
                        title="Update Status"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteApplication(app._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#e74c3c",
                          marginRight: "0.5rem",
                        }}
                        title="Delete Application"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => handleSendMessage(app)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#1a5490",
                        }}
                        title="Send Message"
                      >
                        <Mail size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Status Update Modal */}
      {showStatusModal && selectedApplication && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            width: "90%",
            maxWidth: "500px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Update Application Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <strong>Teacher:</strong> {selectedApplication.teacherId?.name || "N/A"}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Job:</strong> {selectedApplication.jobId?.title || "N/A"}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Current Status:</strong>
              <span style={{
                background: getStatusColor(selectedApplication.status),
                color: "white",
                padding: "0.25rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                marginLeft: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}>
                {getStatusIcon(selectedApplication.status)}
                {getStatusLabel(selectedApplication.status)}
              </span>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                New Status:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "0.25rem",
                  fontSize: "1rem",
                }}
              >
                {validStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Notes (optional):
              </label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "0.25rem",
                  fontSize: "1rem",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#e0e0e0",
                  color: "black",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#1a5490",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedTeacher && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            width: "90%",
            maxWidth: "500px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Send Message to Teacher</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <strong>To:</strong> {selectedTeacher?.name || "N/A"}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Job:</strong> {selectedApplication?.jobId?.title || "N/A"}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                Message:
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "0.25rem",
                  fontSize: "1rem",
                  minHeight: "120px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#e0e0e0",
                  color: "black",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessageSubmit}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#1a5490",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedApplicationForProfile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            width: "90%",
            maxWidth: "1000px",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3>Complete Teacher Profile & Application Details</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
              >
                <X size={24} />
              </button>
            </div>

            {profileLoading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                Loading teacher profile...
              </div>
            ) : teacherProfile ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                {/* Complete Teacher Profile Section */}
                <div>
                  <h4 style={{ marginBottom: "1rem", color: "#1a5490" }}>👤 Complete Teacher Profile</h4>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    {teacherProfile.photo ? (
                      <img
                        src={`${BASE_URL}${teacherProfile.photo}`}
                        alt={teacherProfile.name}
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "#e0e0e0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "#666",
                        }}
                      >
                        {teacherProfile.name?.charAt(0)?.toUpperCase() || "T"}
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>
                        {teacherProfile.name || "N/A"}
                      </h4>
                      <p style={{ margin: "0", color: "#666" }}>
                        Experience: {teacherProfile.experience || "N/A"} years
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Email:</strong>
                    <p style={{ margin: "0.5rem 0" }}>{teacherProfile.email || "N/A"}</p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Phone:</strong>
                    <p style={{ margin: "0.5rem 0" }}>{teacherProfile.phone || "N/A"}</p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Subjects:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {teacherProfile.subjects?.join(", ") || "No subjects listed"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Classes Level:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {teacherProfile.classesLevel?.join(", ") || "N/A"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Specializations:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {teacherProfile.specializations?.join(", ") || "N/A"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Skills:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {teacherProfile.skills?.join(", ") || "N/A"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Expected Salary:</strong>
                    <p style={{ margin: "0.5rem 0" }}>{teacherProfile.expectedSalary ? `₹${teacherProfile.expectedSalary}` : "N/A"}</p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Job Type:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {teacherProfile.jobType?.join(", ") || "N/A"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Preferred Locations:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {teacherProfile.preferredLocations?.join(", ") || "N/A"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Bio:</strong>
                    <p style={{ margin: "0.5rem 0" }}>{teacherProfile.bio || "N/A"}</p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Resume:</strong>
                    {teacherProfile.resumeUrl ? (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button
                          onClick={() => window.open(`${API_URL.replace('/api', '')}${teacherProfile.resumeUrl}`, '_blank')}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#1a5490",
                            color: "white",
                            border: "none",
                            borderRadius: "0.25rem",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          View Resume
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${API_URL.replace('/api', '')}${teacherProfile.resumeUrl}`;
                            link.download = `${teacherProfile.name}_resume.pdf`;
                            link.click();
                          }}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#27ae60",
                            color: "white",
                            border: "none",
                            borderRadius: "0.25rem",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          Download Resume
                        </button>
                      </div>
                    ) : (
                      <span style={{ marginLeft: "0.5rem", color: "#e74c3c" }}>Not available</span>
                    )}
                  </div>

                  {teacherProfile.certificateUrls && teacherProfile.certificateUrls.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <strong>Certificates:</strong>
                      <div style={{ marginTop: "0.5rem" }}>
                        {teacherProfile.certificateUrls.map((certUrl, index) => (
                          <button
                            key={index}
                            onClick={() => window.open(`${API_URL.replace('/api', '')}${certUrl}`, '_blank')}
                            style={{
                              margin: "0.25rem",
                              padding: "0.25rem 0.5rem",
                              background: "#f39c12",
                              color: "white",
                              border: "none",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            Certificate {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Details Section */}
                <div>
                  <h4 style={{ marginBottom: "1rem", color: "#1a5490" }}>📄 Application Details</h4>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Job Applied For:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {selectedApplicationForProfile.jobId?.title || "N/A"}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                      Subject: {selectedApplicationForProfile.jobId?.subject || "N/A"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Applied Date:</strong>
                    <p style={{ margin: "0.5rem 0" }}>
                      {new Date(selectedApplicationForProfile.appliedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong>Current Status:</strong>
                    <span style={{
                      background: getStatusColor(selectedApplicationForProfile.status),
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginLeft: "0.5rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}>
                      {getStatusIcon(selectedApplicationForProfile.status)}
                      {getStatusLabel(selectedApplicationForProfile.status)}
                    </span>
                  </div>

                  {selectedApplicationForProfile.coverLetter && (
                    <div style={{ marginBottom: "1rem" }}>
                      <strong>Cover Letter:</strong>
                      <div style={{
                        margin: "0.5rem 0",
                        padding: "1rem",
                        background: "#f8f9fa",
                        borderRadius: "0.25rem",
                        border: "1px solid #dee2e6",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}>
                        {selectedApplicationForProfile.coverLetter}
                      </div>
                    </div>
                  )}

                  {/* Application Statistics */}
                  <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "0.5rem" }}>
                    <h5 style={{ marginBottom: "0.5rem", color: "#1a5490" }}>📊 Application Statistics</h5>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
                      <strong>Total Applications:</strong> {teacherProfile.appliedJobsCount || 0}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
                      <strong>Shortlisted:</strong> {teacherProfile.shortlistedCount || 0}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
                      <strong>Hired:</strong> {teacherProfile.hiredCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p>Failed to load teacher profile details.</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
              <button
                onClick={() => {
                  setShowProfileModal(false)
                  setTeacherProfile(null)
                  setProfileLoading(false)
                }}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#e0e0e0",
                  color: "black",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../config/api"

const TeacherJobDetail = () => {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const [applied, setApplied] = useState(false)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [token, setToken] = useState("")
  const [applicationId, setApplicationId] = useState(null)



  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken")
    if (storedToken) {
      setToken(storedToken)
    }
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}`)
      setJob(response.data)

      // Check if user has already applied for this job
      if (token) {
        try {
          const applicationsResponse = await axios.get(`${API_URL}/applications/my-applications`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const userApplications = applicationsResponse.data || []
          const existingApplication = userApplications.find(app => app.jobId?._id === jobId)
          if (existingApplication) {
            setApplied(true)
            setApplicationId(existingApplication._id)
          }
        } catch (appError) {
          console.error("Failed to check application status:", appError)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch job details:", error)
      setError("Failed to load job details")
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!token) {
      // Store the current job page to redirect back after login
      localStorage.setItem("redirectAfterLogin", `/job/${jobId}`)
      alert("Please login to apply for jobs")
      navigate("/teacher/login")
      return
    }

    try {
      const response = await axios.post(`${API_URL}/applications`, { jobId }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApplied(true)
      setApplicationId(response.data._id)
      setShowApplyModal(true)
      setTimeout(() => setShowApplyModal(false), 3000)
    } catch (error) {
      console.error("Failed to apply for job:", error)
      if (error.response?.data?.message === "Already applied to this job") {
        alert("You have already applied for this job.")
      } else {
        alert("Failed to submit application. Please try again.")
      }
    }
  }

  const handleDeleteApplication = async () => {
    if (!applicationId || !confirm("Are you sure you want to delete this application?")) return

    try {
      await axios.delete(`${API_URL}/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApplied(false)
      setApplicationId(null)
      alert("Application deleted successfully")
    } catch (error) {
      console.error("Failed to delete application:", error)
      alert("Failed to delete application. Please try again.")
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading job details...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        {error}
      </div>
    )
  }

  if (!job) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Job not found
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f7fa", padding: "20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          backgroundColor: "white",
          padding: "15px 20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={() => navigate("/dashboard/teacher")}
          style={{
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#2563eb",
          }}
        >
          ← Back to Dashboard
        </button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            style={{
              backgroundColor: saved ? "#fecaca" : "white",
              border: "2px solid #e5e7eb",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onClick={() => setSaved(!saved)}
          >
            {saved ? "❤️ Saved" : "🤍 Save Job"}
          </button>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleApply}
              disabled={applied}
              style={{
                backgroundColor: applied ? "#86efac" : "#2563eb",
                color: "white",
                border: "none",
                padding: "8px 20px",
                borderRadius: "6px",
                cursor: applied ? "default" : "pointer",
                opacity: applied ? 0.7 : 1,
              }}
            >
              {applied ? "✓ Applied" : "Apply Now"}
            </button>
            {applied && (
              <button
                onClick={handleDeleteApplication}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete Application
              </button>
            )}
          </div>
        </div>
      </header>

      {showApplyModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              textAlign: "center",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>✓</div>
            <h3 style={{ marginBottom: "20px", color: "#1f2937" }}>Application Submitted Successfully!</h3>
            <p style={{ color: "#6b7280", marginBottom: "25px" }}>
              Your application has been sent to the institution. You can track its status in your applications.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setShowApplyModal(false)
                  navigate("/jobs")
                }}
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Back to Jobs
              </button>
              <button
                onClick={() => {
                  setShowApplyModal(false)
                  navigate("/dashboard/teacher")
                }}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 300px", gap: "30px" }}
      >
        {/* Main Content */}
        <main>
          {/* Job Header */}
          <section
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px", color: "#1f2937" }}>
              {job.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              {job.institutionId?.photo && (
                <img
                  src={`${API_URL.replace('/api', '')}${job.institutionId.photo}`}
                  alt={job.institutionId?.name || 'Institution'}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}
              <p style={{ fontSize: "18px", color: "#6b7280" }}>{job.institutionId?.name || 'Institution'}</p>
            </div>
            <div style={{ display: "flex", gap: "20px", color: "#6b7280", fontSize: "14px" }}>
              <span>
                ⭐ {job.institutionId?.rating || 4.5} ({job.institutionId?.employeeCount || 0} employees)
              </span>
              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </section>

          {/* Quick Info */}
          <section
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "20px" }}
          >
            {[
              { label: "Salary", value: job.salaryRange },
              { label: "Experience", value: job.experienceRequired },
              { label: "Job Type", value: job.jobType },
              { label: "Location", value: job.location },
            ].map((info, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>{info.label}</p>
                <p style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>{info.value}</p>
              </div>
            ))}
          </section>

          {/* Description */}
          <section
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
              About this role
            </h2>
            <p style={{ color: "#4b5563", lineHeight: "1.6" }}>{job.description || 'No description available'}</p>
          </section>

          {/* Responsibilities */}
          <section
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
              Your Responsibilities
            </h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities.map((resp, idx) => (
                <li
                  key={idx}
                  style={{ marginBottom: "10px", color: "#4b5563", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span>✓</span> {resp}
                </li>
              )) : (
                <li style={{ color: "#4b5563" }}>No responsibilities specified</li>
              )}
            </ul>
          </section>

          {/* Requirements */}
          <section
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
              What we're looking for
            </h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {job.requirements && job.requirements.length > 0 ? job.requirements.map((req, idx) => (
                <li
                  key={idx}
                  style={{ marginBottom: "10px", color: "#4b5563", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span>✓</span> {req}
                </li>
              )) : (
                <li style={{ color: "#4b5563" }}>No requirements specified</li>
              )}
            </ul>
          </section>

          {/* Perks */}
          <section
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
              Benefits & Perks
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
              {job.benefits && job.benefits.length > 0 ? job.benefits.map((perk, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "6px",
                    color: "#4b5563",
                  }}
                >
                  <span>💼</span> {perk}
                </div>
              )) : (
                <div style={{ color: "#4b5563" }}>No benefits specified</div>
              )}
            </div>
          </section>

          {/* Institution Info */}
          <section
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
              About {job.institutionId?.name || 'Institution'}
            </h2>
            <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: "15px" }}>{job.institutionId?.description || 'No description available'}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>Rating</p>
                <p style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>⭐ {job.institutionId?.rating || 4.5}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>Employees</p>
                <p style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>{job.institutionId?.employeeCount || 0}+</p>
              </div>
            </div>
          </section>

          {/* Similar Jobs */}
          <section
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
              Similar Jobs
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h4 style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>Physics Teacher</h4>
                  <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>St. Stephens School</p>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#2563eb", marginBottom: "10px" }}>
                    ₹5L - 7L
                  </p>
                  <button
                    style={{
                      backgroundColor: "#dbeafe",
                      color: "#2563eb",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside>
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontWeight: "600", marginBottom: "10px", color: "#1f2937" }}>Location</h3>
            <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "10px" }}>{job.location}</p>
            <div
              style={{
                backgroundColor: "#f3f4f6",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              📍 Map View (5 km from your location)
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontWeight: "600", marginBottom: "10px", color: "#1f2937" }}>Share this job</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  padding: "8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#4b5563",
                }}
              >
                Share on LinkedIn
              </button>
              <button
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  padding: "8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#4b5563",
                }}
              >
                Share on WhatsApp
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontWeight: "600", marginBottom: "10px", color: "#1f2937" }}>Quick Actions</h3>
            <button
              style={{
                width: "100%",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                padding: "10px",
                borderRadius: "6px",
                cursor: "pointer",
                marginBottom: "10px",
                fontWeight: "500",
              }}
            >
              Apply Now
            </button>
            <button
              style={{
                width: "100%",
                backgroundColor: "white",
                color: "#2563eb",
                border: "2px solid #2563eb",
                padding: "10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Save Job
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default TeacherJobDetail

"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogOut, MapPin, TrendingUp, MessageSquare, Trash2 } from "lucide-react"
import { logout } from "../lib/auth"
import axios from "axios"
import ProfileCompletionModal from "../components/ProfileCompletionModal"
import NearbyJobsMapSection from "../components/NearbyJobsMapSection"
import Logo from "../components/Logo"

import { API_URL, BASE_URL } from "../config/api"

const normalizeUrl = (url) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("/")) return `${BASE_URL}${url}`
  return `${BASE_URL}/${url}`
}

const renderError = (errorMessage) => {
  return (
    <div
      style={{
        backgroundColor: "#fee",
        color: "#c33",
        padding: "1rem",
        borderRadius: "0.5rem",
        marginBottom: "1rem",
        border: "1px solid #fcc",
      }}
      role="alert"
    >
      ⚠️ {errorMessage}
    </div>
  )
}

export default function TeacherDashboard() {
  const [applications, setApplications] = useState([])
  const [applicationsError, setApplicationsError] = useState(null)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [nearbyJobs, setNearbyJobs] = useState([])
  const [nearbyJobsError, setNearbyJobsError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadMessagesError, setUnreadMessagesError] = useState(null)
  // Removed pageLoading state as per requirement to remove loading splash
  const token = localStorage.getItem("accessToken")
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error("Failed to parse user data:", e)
      }
    }

    const cachedProfile = localStorage.getItem("teacherProfile")
    if (cachedProfile) {
      try {
        const p = JSON.parse(cachedProfile)
        if (p?.photo) p.photo = normalizeUrl(p.photo)
        setProfile(p)
      } catch (e) {
        console.error("Failed to parse cached profile:", e)
      }
    }

    if (location.state?.showProfileCompletion) {
      setShowProfileModal(true)
    }

    const onProfileUpdated = (e) => {
      const updated = e?.detail || null
      if (updated) {
        if (updated.photo) updated.photo = normalizeUrl(updated.photo)
        setProfile(updated)
        try {
          localStorage.setItem("teacherProfile", JSON.stringify(updated))
        } catch (err) {
          console.error("Failed to cache profile:", err)
        }
      }
      fetchUserProfile()
    }

    const onStorage = (e) => {
      try {
        if (e.key === "teacherProfile" && e.newValue) {
          const p = JSON.parse(e.newValue)
          if (p?.photo) p.photo = normalizeUrl(p.photo)
          setProfile(p)
        }
      } catch (err) {
        console.error("Failed to sync profile from storage:", err)
      }
    }

    const onAppLogout = () => {
      setProfile(null)
      setUser(null)
      setApplications([])
      setNearbyJobs([])
      setUnreadMessages(0)
    }

    window.addEventListener("teacherProfileUpdated", onProfileUpdated)
    window.addEventListener("storage", onStorage)
    window.addEventListener("app:logout", onAppLogout)

    return () => {
      window.removeEventListener("teacherProfileUpdated", onProfileUpdated)
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("app:logout", onAppLogout)
    }
  }, [])

  const fetchApplications = async () => {
    try {
      setApplicationsError(null)
      if (!token) {
        throw new Error("No access token available")
      }
      const response = await axios.get(`${API_URL}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApplications(response.data || [])
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch applications"
      setApplicationsError(message)
      console.error("Applications fetch error:", error)
    }
  }

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return

    try {
      await axios.delete(`${API_URL}/applications/${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApplications(applications.filter(app => app._id !== appId))
    } catch (error) {
      console.error("Failed to delete application:", error)
      alert("Failed to delete application. Please try again.")
    }
  }

  const fetchUserProfile = async () => {
    try {
      setProfileError(null)
      if (!token) {
        throw new Error("No access token available")
      }
      const response = await axios.get(`${API_URL}/profile/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const prof = response.data || {}
      if (prof.photo) prof.photo = normalizeUrl(prof.photo)
      setProfile(prof)
      try {
        localStorage.setItem("teacherProfile", JSON.stringify(prof))
      } catch (e) {
        console.error("Failed to cache profile:", e)
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch profile"
      setProfileError(message)
      console.error("Profile fetch error:", error)
      if (error.response?.status === 404) {
        setShowProfileModal(true)
      }
    }
  }

  // Helper function to delay for retry intervals
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchNearbyJobs = async (useProfileLocation = false) => {
    let attempts = 0
    const maxRetries = 2

    const fetchJobData = async () => {
      try {
        setLoading(true)
        setNearbyJobsError(null)
        if (!token) {
          throw new Error("No access token available")
        }

        let latitude = null
        let longitude = null
        let locationSource = "geolocation"

        // Try geolocation first (unless explicitly using profile location)
        if (!useProfileLocation) {
          if (navigator.permissions) {
            try {
              const permissionStatus = await navigator.permissions.query({ name: "geolocation" })
              if (permissionStatus.state === "denied") {
                console.warn("Location permission denied, falling back to profile location")
                useProfileLocation = true
              }
            } catch (permErr) {
              console.warn("Permission API not supported:", permErr)
            }
          }

          if (!useProfileLocation) {
            const getPosition = () =>
              new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 15000, // Increased timeout to 15 seconds
                  enableHighAccuracy: true
                })
              })

            try {
              const position = await getPosition()
              latitude = position.coords.latitude
              longitude = position.coords.longitude
            } catch (err) {
              console.warn("Geolocation error:", err)
              // Fall back to profile location instead of showing error immediately
              useProfileLocation = true
            }
          }
        }

        // Use profile location as fallback
        if (useProfileLocation && profile) {
          locationSource = "profile"
          // If profile has city/state, we could geocode it, but for now let's fetch jobs by city/state
          if (profile.city && profile.state) {
            try {
              // Try to fetch jobs by city/state instead of coordinates
              const response = await axios.get(
                `${API_URL}/jobs?city=${encodeURIComponent(profile.city)}&state=${encodeURIComponent(profile.state)}&limit=20`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              )
              setNearbyJobs(response.data.jobs || [])
              console.log(`Fetched ${response.data.jobs?.length || 0} jobs using profile location (${profile.city}, ${profile.state})`)
              return true
            } catch (profileErr) {
              console.warn("Failed to fetch jobs by profile location:", profileErr)
              // Fall back to fetching all jobs
            }
          }
        }

        // If we have coordinates (from geolocation), use nearby endpoint
        if (latitude !== null && longitude !== null) {
          const response = await axios.get(
            `${API_URL}/jobs/nearby?latitude=${latitude}&longitude=${longitude}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          setNearbyJobs(response.data.jobs || [])
          console.log(`Fetched ${response.data.jobs?.length || 0} nearby jobs using ${locationSource}`)
          return true
        }

        // Final fallback: fetch recent jobs
        console.log("Falling back to fetching recent jobs")
        const response = await axios.get(
          `${API_URL}/jobs?limit=20&skip=0`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setNearbyJobs(response.data.jobs || [])
        console.log(`Fetched ${response.data.jobs?.length || 0} recent jobs as fallback`)
        return true

      } catch (error) {
        attempts++
        const status = error.response?.status
        if (status === 500 && attempts <= maxRetries) {
          console.warn(
            `Nearby jobs fetch failed with 500 error, retrying attempt ${attempts} of ${maxRetries}...`
          )
          await delay(1500)
          return await fetchJobData()
        } else {
          const message =
            status === 500
              ? "Server error occurred while fetching nearby jobs. Please try again later."
              : error.response?.data?.message || error.message || "Failed to fetch nearby jobs"
          setNearbyJobsError(message)
          console.error("Nearby jobs fetch error:", error)
          return false
        }
      } finally {
        setLoading(false)
      }
    }

    await fetchJobData()
  }

  const fetchUnreadMessages = async () => {
    try {
      setUnreadMessagesError(null)
      if (!token) {
        throw new Error("No access token available")
      }
      const response = await axios.get(`${API_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUnreadMessages(response.data?.count || 0)
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch unread messages"
      setUnreadMessagesError(message)
      console.error("Unread messages fetch error:", error)
    }
  }

  const fetchInterviews = async () => {
    try {
      setInterviewsError(null)
      if (!token) {
        throw new Error("No access token available")
      }
      const response = await axios.get(`${API_URL}/interviews`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInterviews(response.data || [])
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch interviews"
      setInterviewsError(message)
      console.error("Interviews fetch error:", error)
    }
  }

  const handleLogout = () => {
    setProfile(null)
    setUser(null)
    setApplications([])
    setNearbyJobs([])
    setUnreadMessages(0)
    logout(navigate)
  }

  const getStatusColor = (status) => {
    const colors = {
      applied: "#ff6b35",
      "under-review": "#f39c12",
      shortlisted: "#2ecc71",
      rejected: "#e74c3c",
      accepted: "#27ae60",
      "interview-scheduled": "#9b59b6",
    }
    return colors[status] || "#666"
  }

  const getProfileCompletionPercent = () => {
    if (!profile) return 0
    let filled = 0
    const total = 15

    if (profile.name) filled++
    if (profile.email) filled++
    if (profile.phone) filled++
    if (profile.photo) filled++
    if (profile.bio) filled++
    if (profile.experience) filled++
    if (profile.subjects?.length > 0) filled++
    if (profile.degrees?.length > 0) filled++
    if (profile.certificates?.length > 0) filled++
    if (profile.resumeUrl) filled++
    if (profile.marksCards?.length > 0) filled++
    if (profile.skills?.length > 0) filled++
    if (profile.expectedSalary) filled++
    if (profile.preferredLocations?.length > 0) filled++
    if (profile.availability) filled++

    return Math.round((filled / total) * 100)
  }

  useEffect(() => {
    const load = async () => {
      if (!token) {
        navigate("/login")
        return
      }

      await Promise.allSettled([
        fetchApplications(),
        fetchUserProfile(),
        fetchNearbyJobs(),
        fetchUnreadMessages()
      ])
    }
    load()
  }, [token])

  // Fetch nearby jobs when the nearby-jobs tab is activated
  useEffect(() => {
    if (activeTab === "nearby-jobs" && token && profile) {
      fetchNearbyJobs()
    }
  }, [activeTab, token, profile])

  const hasErrors = applicationsError || profileError || nearbyJobsError || unreadMessagesError

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <div className="flex gap-2">
            <Link to="/jobs" className="btn btn-secondary btn-sm">
              Browse Jobs
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <section style={{ padding: "2rem 0", background: "#f8f9fa", minHeight: "calc(100vh - 80px)" }}>
        <div className="container">
          {hasErrors && (
            <div style={{ marginBottom: "2rem" }}>
              {applicationsError && renderError(applicationsError)}
              {profileError && renderError(profileError)}
              {nearbyJobsError && renderError(nearbyJobsError)}
              {unreadMessagesError && renderError(unreadMessagesError)}
            </div>
          )}

          <div className="grid" style={{ gridTemplateColumns: "280px 1fr", gap: "2rem" }}>
            <div>
              <div className="card" style={{ marginBottom: "1.5rem", textAlign: "center", background: "white" }}>
                {profile?.photo ? (
                  <img
                    src={normalizeUrl(profile.photo)}
                    alt={profile?.name || "Teacher"}
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      margin: "0 auto 1rem",
                      border: "4px solid #1a5490",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem",
                      fontSize: "3rem",
                      color: "white",
                    }}
                  >
                    👤
                  </div>
                )}
                <h4 style={{ margin: "0.5rem 0", fontSize: "1.1rem" }}>{profile?.name || "Teacher"}</h4>
                <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                  {profile?.email || "No email"}
                </p>
                <p style={{ color: "#999", fontSize: "0.8rem", margin: "0" }}>
                  {profile?.currentAddress || "Location not set"}
                </p>

                {profile?.resumeUrl && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <a
                      href={normalizeUrl(profile.resumeUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1a5490", fontWeight: 600, textDecoration: "none" }}
                    >
                      📄 View Resume
                    </a>
                  </div>
                )}

                {profile?.skills && profile.skills.length > 0 && (
                  <div style={{ marginTop: "0.75rem", textAlign: "left" }}>
                    <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#666", fontWeight: "600" }}>
                      Skills
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {profile.skills.slice(0, 6).map((s, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#e8f4f8",
                            color: "#1a5490",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
                  <p style={{ color: "#999", fontSize: "0.75rem", margin: "0 0 0.5rem" }}>Profile Completion</p>
                  <div
                    style={{
                      background: "#e0e0e0",
                      borderRadius: "10px",
                      height: "10px",
                      marginBottom: "0.5rem",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(90deg, #1a5490 0%, #2ecc71 100%)",
                        height: "100%",
                        width: `${getProfileCompletionPercent()}%`,
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>
                  <p style={{ color: "#666", fontSize: "0.875rem", fontWeight: "600", margin: "0" }}>
                    {getProfileCompletionPercent()}% Complete
                  </p>
                </div>
              </div>

              <div className="card" style={{ background: "white" }}>
                <h4 style={{ marginBottom: "1rem", fontSize: "1rem", color: "#333" }}>Dashboard</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    { id: "overview", label: "Overview", icon: "📊" },
                    { id: "applications", label: "Applications", icon: "📋" },
                    { id: "nearby-jobs", label: "Nearby Jobs", icon: "📍" },
                  ].map((item) => (
                    <li key={item.id} style={{ marginBottom: "0.5rem" }}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        style={{
                          background: activeTab === item.id ? "#1a5490" : "transparent",
                          color: activeTab === item.id ? "white" : "#666",
                          padding: "0.75rem 1rem",
                          border: "none",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.95rem",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== item.id) {
                            e.currentTarget.style.background = "#f0f0f0"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== item.id) {
                            e.currentTarget.style.background = "transparent"
                          }
                        }}
                      >
                        {item.icon} {item.label}
                      </button>
                    </li>
                  ))}
                </ul>

                <hr style={{ margin: "1rem 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

                <h5 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#666" }}>Quick Links</h5>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    { to: "/teacher/profile", label: "Profile", icon: "👤" },
                    {
                      to: "/teacher/messages",
                      label: `Messages${unreadMessages > 0 ? ` (${unreadMessages})` : ""}`,
                      icon: "💬",
                      unread: unreadMessages,
                    },
                    {
                      to: "/teacher/interviews",
                      label: `Interviews (${applications.filter((a) => a.status === "interview-scheduled").length})`,
                      icon: "🎥",
                    },
                    { to: "/teacher/notifications", label: "Notifications", icon: "🔔" },
                    { to: "/teacher/analytics", label: "Analytics", icon: "📈" },
                    { to: "/teacher/settings", label: "Settings", icon: "⚙️" },
                  ].map((item) => (
                    <li key={item.to} style={{ marginBottom: "0.5rem" }}>
                      <Link
                        to={item.to}
                        style={{
                          color: item.unread > 0 ? "#e74c3c" : "#666",
                          padding: "0.6rem 1rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          textDecoration: "none",
                          fontSize: "0.9rem",
                          transition: "all 0.2s",
                          fontWeight: item.unread > 0 ? "600" : "normal",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f0f0f0"
                          e.currentTarget.style.color = item.unread > 0 ? "#c0392b" : "#1a5490"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent"
                          e.currentTarget.style.color = item.unread > 0 ? "#e74c3c" : "#666"
                        }}
                      >
                        {item.icon} {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              {activeTab === "overview" && (
                <div>
                  <h2 style={{ marginBottom: "2rem", color: "#333" }}>
                    Welcome back, {profile?.name?.split(" ")[0] || "Teacher"}! 👋
                    <br />
                    <small style={{ color: "#666", fontSize: "0.9rem", display: "block", marginTop: "0.5rem" }}>
                      Profile {getProfileCompletionPercent()}% complete • {applications.length} applications •{" "}
                      {applications.filter((a) => a.status === "shortlisted").length} shortlisted •{" "}
                      {applications.filter((a) => a.status === "accepted").length} accepted
                    </small>
                  </h2>

                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem",
                      marginBottom: "2rem",
                    }}
                  >
                    {[
                      {
                        label: "Applications",
                        value: applications.length,
                        color: "#1a5490",
                        subtitle: "Total submitted",
                      },
                      {
                        label: "Shortlisted",
                        value: applications.filter((a) => a.status === "shortlisted").length,
                        color: "#2ecc71",
                        subtitle: "Great progress!",
                      },
                      {
                        label: "Under Review",
                        value: applications.filter((a) => a.status === "under-review").length,
                        color: "#f39c12",
                        subtitle: "Pending decisions",
                      },
                      {
                        label: "Interview Scheduled",
                        value: applications.filter((a) => a.status === "interview-scheduled").length,
                        color: "#9b59b6",
                        subtitle: "Upcoming interviews",
                      },
                      {
                        label: "Accepted",
                        value: applications.filter((a) => a.status === "accepted").length,
                        color: "#27ae60",
                        subtitle: "Successful applications",
                      },
                      {
                        label: "Rejected",
                        value: applications.filter((a) => a.status === "rejected").length,
                        color: "#e74c3c",
                        subtitle: "Unsuccessful applications",
                      },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="card"
                        style={{ textAlign: "center", borderTop: `4px solid ${stat.color}`, background: "white" }}
                      >
                        <p style={{ color: "#666", margin: "0 0 0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>
                          {stat.label}
                        </p>
                        <h2 style={{ margin: "0 0 0.5rem", color: stat.color, fontSize: "2.5rem" }}>{stat.value}</h2>
                        <p style={{ color: "#999", fontSize: "0.8rem", margin: "0" }}>{stat.subtitle}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "1.5rem",
                      marginBottom: "2rem",
                    }}
                  >
                    <div className="card" style={{ background: "white" }}>
                      <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <TrendingUp size={20} /> Recent Applications
                      </h3>
                      {applications.slice(0, 3).length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {applications.slice(0, 3).map((app) => (
                            <li
                              key={app._id}
                              style={{
                                padding: "0.75rem 0",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {app.jobId?.institutionId?.photo && (
                                  <img
                                    src={normalizeUrl(app.jobId.institutionId.photo)}
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
                                  <p style={{ margin: "0", fontWeight: "600", fontSize: "0.95rem" }}>
                                    {app.jobId?.title || "Job"}
                                  </p>
                                  <p style={{ margin: "0.25rem 0 0", color: "#999", fontSize: "0.8rem" }}>
                                    {app.jobId?.institutionId?.institutionName}
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span
                                  style={{
                                    background: getStatusColor(app.status),
                                    color: "white",
                                    padding: "0.375rem 0.75rem",
                                    borderRadius: "9999px",
                                    fontSize: "0.75rem",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {app.status}
                                </span>
                                <button
                                  onClick={() => handleDeleteApplication(app._id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#e74c3c",
                                    padding: "0.25rem",
                                  }}
                                  title="Delete Application"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: "#999", textAlign: "center", padding: "2rem 0" }}>
                          No recent applications
                        </p>
                      )}
                    </div>

                    <div className="card" style={{ background: "white" }}>
                      <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <MessageSquare size={20} /> Quick Actions
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <Link
                          to="/teacher/profile"
                          className="btn"
                          style={{
                            background: "#1a5490",
                            color: "white",
                            padding: "0.75rem",
                            textAlign: "center",
                            textDecoration: "none",
                            borderRadius: "0.5rem",
                            fontSize: "0.9rem",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#15447a")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#1a5490")}
                        >
                          📝 Complete Profile
                        </Link>
                        <Link
                          to="/jobs"
                          className="btn"
                          style={{
                            background: "#2ecc71",
                            color: "white",
                            padding: "0.75rem",
                            textAlign: "center",
                            textDecoration: "none",
                            borderRadius: "0.5rem",
                            fontSize: "0.9rem",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#27ae60")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#2ecc71")}
                        >
                          🔍 Browse Jobs
                        </Link>
                        <button
                          onClick={() => setActiveTab("nearby-jobs")}
                          className="btn"
                          style={{
                            background: "#3498db",
                            color: "white",
                            padding: "0.75rem",
                            border: "none",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#2980b9")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#3498db")}
                        >
                          📍 View Nearby Jobs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "applications" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "2rem",
                    }}
                  >
                    <h2 style={{ color: "#333" }}>My Applications</h2>
                    <Link to="/jobs" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
                      Browse More Jobs
                    </Link>
                  </div>
                  {applications.length === 0 ? (
                    <div className="card text-center" style={{ background: "white", padding: "3rem" }}>
                      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📋</div>
                      <h3 style={{ marginBottom: "1rem", color: "#333" }}>No Applications Yet</h3>
                      <p style={{ color: "#666", marginBottom: "2rem" }}>
                        You haven't applied to any jobs yet. Start browsing jobs to find your perfect match!
                      </p>
                      <Link to="/jobs" className="btn btn-primary">
                        Browse Jobs
                      </Link>
                    </div>
                  ) : (
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}
                    >
                      {applications.map((app) => (
                        <div key={app._id} className="card" style={{ background: "white" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: "0 0 0.5rem", color: "#333" }}>{app.jobId?.title || "Job"}</h4>
                              <p style={{ color: "#666", fontSize: "0.875rem", margin: "0" }}>
                                {app.jobId?.institutionId?.institutionName || "Institution"}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                              <span
                                style={{
                                  background: getStatusColor(app.status),
                                  color: "white",
                                  padding: "0.375rem 0.75rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: "bold",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {app.status}
                              </span>
                              <button
                                onClick={() => handleDeleteApplication(app._id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#e74c3c",
                                  padding: "0.25rem",
                                }}
                                title="Delete Application"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: "0.875rem", color: "#999", marginBottom: "1rem" }}>
                            Applied on {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                          <Link
                            to={`/teacher/jobs/${app.jobId?._id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.875rem", width: "100%", textAlign: "center" }}
                          >
                            View Job Details
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "nearby-jobs" && (
                <div>
                  <h2 style={{ marginBottom: "2rem", color: "#333" }}>Nearby Job Opportunities</h2>

                  <NearbyJobsMapSection token={token} />

                  {loading ? (
                    <div className="card text-center" style={{ marginTop: "2rem", background: "white", padding: "3rem" }}>
                      <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 2s infinite" }}>📍</div>
                      <p style={{ color: "#666" }}>Loading nearby jobs...</p>
                    </div>
                  ) : nearbyJobsError ? (
                    <div className="card text-center" style={{ marginTop: "2rem", background: "white", padding: "3rem" }}>
                      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
                      <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>{nearbyJobsError}</p>
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => fetchNearbyJobs(false)}
                          className="btn btn-primary"
                        >
                          Try Location Again
                        </button>
                        {profile?.city && profile?.state && (
                          <button
                            onClick={() => fetchNearbyJobs(true)}
                            className="btn btn-secondary"
                          >
                            Use Profile Location
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Fetch recent jobs as fallback
                            fetchNearbyJobs(true)
                          }}
                          className="btn btn-outline"
                        >
                          Show Recent Jobs
                        </button>
                      </div>
                    </div>
                  ) : nearbyJobs.length === 0 ? (
                    <div className="card text-center" style={{ marginTop: "2rem", background: "white", padding: "3rem" }}>
                      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📍</div>
                      <h3 style={{ marginBottom: "1rem", color: "#333" }}>No Nearby Jobs Found</h3>
                      <p style={{ color: "#666", marginBottom: "2rem" }}>
                        Complete your profile to get better recommendations.
                      </p>
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                        <button onClick={() => setShowProfileModal(true)} className="btn btn-primary">
                          Complete Profile
                        </button>
                        <Link to="/jobs" className="btn btn-secondary" style={{ marginLeft: "1rem" }}>
                          Browse All Jobs
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "1.5rem",
                        marginTop: "2rem",
                      }}
                    >
                      {nearbyJobs.map((job) => (
                        <div key={job._id} className="card" style={{ background: "white" }}>
                          <div style={{ marginBottom: "1rem" }}>
                            <h4 style={{ margin: "0 0 0.5rem", color: "#333" }}>{job.title}</h4>
                            <p style={{ color: "#666", fontSize: "0.875rem", margin: "0" }}>
                              {job.institutionId?.institutionName}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                color: "#666",
                                fontSize: "0.875rem",
                              }}
                            >
                              <MapPin size={16} /> {job.location}
                            </span>
                            {job.distance && (
                              <span style={{ color: "#666", fontSize: "0.875rem" }}>📍 {job.distance}</span>
                            )}
                          </div>
                          <p style={{ fontSize: "0.875rem", color: "#999", marginBottom: "1rem" }}>
                            {job.description?.substring(0, 100)}...
                          </p>
                          <Link
                            to={`/teacher/jobs/${job._id}`}
                            className="btn btn-primary"
                            style={{ fontSize: "0.875rem", width: "100%", textAlign: "center" }}
                          >
                            View Details
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={user?._id}
        token={token}
        onProfileUpdate={(updatedProfile) => {
          if (updatedProfile?.photo) updatedProfile.photo = normalizeUrl(updatedProfile.photo)
          setProfile(updatedProfile)
          fetchNearbyJobs()
        }}
      />
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { MapPin, DollarSign, Briefcase, Heart, Share2, ArrowLeft } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL } from "../config/api"

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentLocation, setCurrentLocation] = useState("Loading...")
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    fetchJobDetail()
    getCurrentLocation()
  }, [id])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            // Use a free geocoding API to get city name
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            const data = await response.json()
            const city = data.city || data.locality || "Mumbai"
            const country = data.countryName || "India"
            setCurrentLocation(`${city}, ${country}`)
          } catch (error) {
            console.error("Error fetching location name:", error)
            setCurrentLocation("Mumbai, India") // Fallback
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          setCurrentLocation("Mumbai, India") // Fallback
        }
      )
    } else {
      setCurrentLocation("Mumbai, India") // Fallback if geolocation not supported
    }
  }

  const fetchJobDetail = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${id}`)
      setJob(response.data)
    } catch (error) {
      console.error("Failed to fetch job:", error)
      // Fallback to mock data
      setJob({
        _id: id,
        title: "Mathematics Teacher",
        institutionId: {
          institutionName: "XYZ International School",
          description: "Leading international school",
          location: currentLocation,
        },
        city: currentLocation,
        location: currentLocation,
        salary: { min: 40000, max: 60000 },
        employmentType: "Full-time",
        minExperience: 2,
        description:
          "Looking for an experienced Mathematics teacher for grades 9-12. We seek passionate educators who can inspire students and create engaging learning experiences.",
        responsibilities: [
          "Teach mathematics to grades 9-12",
          "Develop lesson plans and assessments",
          "Maintain student records and communicate with parents",
          "Participate in school events and professional development",
        ],
        requirements: [
          "Bachelor's degree in Mathematics or related field",
          "B.Ed certification or equivalent teaching qualification",
          "2+ years of teaching experience",
          "Strong communication and organizational skills",
          "Proficiency with educational technology tools",
        ],
        perks: [
          "Competitive salary package",
          "Health insurance coverage",
          "Professional development opportunities",
          "Summer vacation",
          "Flexible working hours",
        ],
        posted: "2 days ago",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!token) {
      alert("Please login first")
      navigate("/login-teacher")
      return
    }

    try {
      await axios.post(`${API_URL}/applications`, { jobId: id }, { headers: { Authorization: `Bearer ${token}` } })
      setApplied(true)
      alert("Application submitted successfully!")
    } catch (error) {
      console.error("Failed to apply:", error)
      alert("Failed to submit application")
    }
  }

  const handleSave = async () => {
    if (!token) {
      alert("Please login first")
      return
    }
    setSaved(!saved)
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <p>Loading job details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <p>Job not found</p>
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
          <Link to="/jobs" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Jobs
          </Link>
        </div>
      </nav>

      <section style={{ padding: "2rem 0" }}>
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: "2rem" }}>
            <div>
              {/* Job Header */}
              <div className="card" style={{ marginBottom: "2rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {job.institutionId?.photo && (
                      <img
                        src={`${API_URL.replace('/api', '')}${job.institutionId.photo}`}
                        alt={job.institutionId?.institutionName || 'Institution'}
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div>
                      <h1 style={{ marginBottom: "0.5rem" }}>{job.title}</h1>
                      <p style={{ fontSize: "1.125rem", color: "#666" }}>{job.institutionId?.institutionName}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#666" }}>
                          ⭐ {job.institutionRating || 0} ({job.employeeCount || 0} employees)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={handleSave}
                      style={{
                        background: saved ? "#ff6b6b" : "#f0f0f0",
                        color: saved ? "white" : "#666",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Heart size={18} />
                    </button>
                    <button
                      style={{
                        background: "#f0f0f0",
                        color: "#666",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#666" }}>
                    <MapPin size={20} /> {job.location || job.city}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#666" }}>
                    <DollarSign size={20} /> ₹{job.salary?.min || 0}-{job.salary?.max || 0}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#666" }}>
                    <Briefcase size={20} /> {job.employmentType || job.type}
                  </span>
                  <span style={{ color: "#999", fontSize: "0.875rem" }}>Posted {job.posted}</span>
                </div>
              </div>

              {/* Description */}
              <div className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>About this role</h3>
                <p style={{ lineHeight: "1.6", color: "#555" }}>{job.description}</p>
              </div>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1rem" }}>Your Responsibilities</h3>
                  <ul style={{ lineHeight: "1.8" }}>
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} style={{ marginBottom: "0.5rem", color: "#555" }}>
                        ✓ {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1rem" }}>What we're looking for</h3>
                  <ul style={{ lineHeight: "1.8" }}>
                    {job.requirements.map((req, idx) => (
                      <li key={idx} style={{ marginBottom: "0.5rem", color: "#555" }}>
                        ✓ {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Perks */}
              {job.perks && job.perks.length > 0 && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1rem" }}>Benefits & Perks</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {job.perks.map((perk, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#555" }}>
                        <span>💼</span> {perk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About Institution */}
              <div className="card">
                <h3 style={{ marginBottom: "1rem" }}>About {job.institutionId?.institutionName}</h3>
                <p style={{ lineHeight: "1.6", color: "#555", marginBottom: "1rem" }}>
                  {job.institutionId?.description || "A leading educational institution committed to excellence"}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="card" style={{ position: "sticky", top: "100px" }}>
                <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e0e0e0" }}>
                  <p style={{ fontSize: "0.875rem", color: "#999", marginBottom: "0.5rem" }}>Experience Required</p>
                  <p style={{ fontWeight: "600", fontSize: "1.125rem" }}>{job.minExperience}+ years</p>
                </div>

                <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e0e0e0" }}>
                  <p style={{ fontSize: "0.875rem", color: "#999", marginBottom: "0.5rem" }}>Employment Type</p>
                  <p style={{ fontWeight: "600" }}>{job.employmentType}</p>
                </div>

                <button
                  onClick={handleApply}
                  disabled={applied}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    marginBottom: "1rem",
                    opacity: applied ? 0.6 : 1,
                    cursor: applied ? "not-allowed" : "pointer",
                  }}
                >
                  {applied ? "✓ Applied" : "Apply Now"}
                </button>

                {!token && (
                  <p style={{ fontSize: "0.875rem", color: "#666", textAlign: "center" }}>
                    <Link to="/login-teacher" style={{ color: "#1a5490", textDecoration: "none", fontWeight: "600" }}>
                      Login to apply
                    </Link>
                  </p>
                )}

                <p style={{ fontSize: "0.875rem", color: "#999", marginTop: "1rem", textAlign: "center" }}>
                  Posted {job.posted}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

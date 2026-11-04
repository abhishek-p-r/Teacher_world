"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MapPin } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"
import KarnatakaMap from "../components/KarnatakaMap"

import { API_URL } from "../config/api"

export default function InstitutionEditJob() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    qualifications: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    experienceRequired: "",
    jobType: "full-time",
    salaryRange: "",
    city: "",
    state: "",
    pinCode: "",
    location: "",
    startDate: "",
    deadline: "",
    employmentType: "full-time",
    institutionRating: "",
    employeeCount: "",
    latitude: "",
    longitude: "",
  })

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    if (id) {
      fetchJob()
    }
  }, [id])

  const fetchJob = async () => {
    try {
      setFetchLoading(true)
      const response = await axios.get(`${API_URL}/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const job = response.data
      setFormData({
        title: job.title || "",
        description: job.description || "",
        subject: job.subject || "",
        qualifications: Array.isArray(job.qualifications) ? job.qualifications.join('\n') : job.qualifications || "",
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : job.responsibilities || "",
        requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || "",
        benefits: Array.isArray(job.benefits) ? job.benefits.join('\n') : job.benefits || "",
        experienceRequired: job.experienceRequired || "",
        jobType: job.jobType || "full-time",
        salaryRange: job.salaryRange || "",
        city: job.city || "",
        state: job.state || "",
        pinCode: job.pinCode || "",
        location: job.location || "",
        startDate: job.startDate ? job.startDate.split('T')[0] : "",
        deadline: job.deadline ? job.deadline.split('T')[0] : "",
        employmentType: job.employmentType || "full-time",
        institutionRating: job.institutionRating || "",
        employeeCount: job.employeeCount || "",
        latitude: job.coordinates?.coordinates?.[1] || "",
        longitude: job.coordinates?.coordinates?.[0] || "",
      })
    } catch (error) {
      console.error("Failed to fetch job:", error)
      setError("Failed to load job details")
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchLocationFromPinCode = async (pin) => {
    if (!pin || pin.length !== 6) return
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
      const data = await response.json()
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0]
        setFormData((prev) => ({
          ...prev,
          city: postOffice.District || prev.city,
          state: postOffice.State || prev.state,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch location from pinCode:", error)
    }
  }

  const handlePinCodeChange = (value) => {
    setFormData((prev) => ({ ...prev, pinCode: value }))
    if (value.length === 6) {
      fetchLocationFromPinCode(value)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Prepare payload and ensure coordinates are present
      const payload = { ...formData }

      const hasLat = payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== ''
      const hasLng = payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== ''

      // Try browser geolocation if manual coords not provided
      const getPosition = () =>
        new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          )
        })

      const geocodeFromAddress = async (pin, city, state) => {
        try {
          const parts = [pin, city, state].filter(Boolean).join(' ')
          if (!parts) return null
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parts)}&limit=1`
          const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
          if (!res.ok) return null
          const results = await res.json()
          if (!results || results.length === 0) return null
          const r = results[0]
          return { latitude: Number.parseFloat(r.lat), longitude: Number.parseFloat(r.lon) }
        } catch (e) {
          return null
        }
      }

      if (hasLat) payload.latitude = Number.parseFloat(payload.latitude)
      if (hasLng) payload.longitude = Number.parseFloat(payload.longitude)

      if (!hasLat || !hasLng) {
        let coords = null
        try {
          coords = await getPosition()
        } catch (err) {
          // ignore and try geocode
        }

        if (!coords) {
          const geo = await geocodeFromAddress(payload.pinCode, payload.city, payload.state)
          if (geo) {
            payload.latitude = geo.latitude
            payload.longitude = geo.longitude
          } else {
            setLoading(false)
            setError('Unable to determine location. Please allow location access or enter latitude and longitude in the form.')
            return
          }
        } else {
          payload.latitude = coords.latitude
          payload.longitude = coords.longitude
        }
      }

      await axios.put(`${API_URL}/jobs/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
      alert("Job updated successfully!")
      navigate("/dashboard/institution")
    } catch (error) {
      console.error("Failed to update job:", error)
      setError("Failed to update job")
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #3498db", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ marginTop: "1rem" }}>Loading job details...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
        <div className="container" style={{ maxWidth: "900px" }}>
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h1>Edit Job</h1>
            <p style={{ color: "#666" }}>Update the job details to attract the best teachers</p>
          </div>

          {error && (
            <div style={{ background: "#fee", color: "#c33", padding: "1rem", borderRadius: "4px", marginBottom: "2rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="card">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Mathematics Teacher"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder="e.g., Mathematics"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g., New York"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>State *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="e.g., NY"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Pin Code</label>
                <input
                  type="text"
                  value={formData.pinCode}
                  onChange={(e) => handlePinCodeChange(e.target.value)}
                  placeholder="e.g., 123456"
                  className="form-control"
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Latitude (optional)</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    placeholder="e.g., 12.9716"
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Longitude (optional)</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    placeholder="e.g., 77.5946"
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Select Location on Map</label>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  Click on the map to set the job location coordinates
                </p>
                <KarnatakaMap
                  center={[14.0, 76.25]}
                  zoom={7}
                  height="300px"
                  onMapClick={(latlng) => {
                    handleChange('latitude', latlng.lat.toFixed(6))
                    handleChange('longitude', latlng.lng.toFixed(6))
                  }}
                  markers={formData.latitude && formData.longitude ? [{
                    lat: parseFloat(formData.latitude),
                    lng: parseFloat(formData.longitude),
                    popup: 'Selected Location'
                  }] : []}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Salary Range</label>
                <input
                  type="text"
                  value={formData.salaryRange}
                  onChange={(e) => handleChange("salaryRange", e.target.value)}
                  placeholder="e.g., ₹5L - 7L"
                  className="form-control"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Experience Required</label>
                <input
                  type="text"
                  value={formData.experienceRequired}
                  onChange={(e) => handleChange("experienceRequired", e.target.value)}
                  placeholder="e.g., 2-5 years"
                  className="form-control"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Job Type</label>
                <select
                  value={formData.jobType}
                  onChange={(e) => handleChange("jobType", e.target.value)}
                  className="form-control"
                >
                  <option value="Teaching">Teaching</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="form-control"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => handleChange("employmentType", e.target.value)}
                  className="form-control"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className="form-control"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Application Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  className="form-control"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Institution Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.institutionRating}
                  onChange={(e) => handleChange("institutionRating", e.target.value)}
                  placeholder="e.g., 4.5"
                  className="form-control"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Employee Count</label>
                <input
                  type="number"
                  min="0"
                  value={formData.employeeCount}
                  onChange={(e) => handleChange("employeeCount", e.target.value)}
                  placeholder="e.g., 50"
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Job Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="form-control"
                rows="5"
                placeholder="Describe the job role and responsibilities..."
                required
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Responsibilities</label>
              <textarea
                value={formData.responsibilities}
                onChange={(e) => handleChange("responsibilities", e.target.value)}
                className="form-control"
                rows="4"
                placeholder="Enter job responsibilities..."
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleChange("requirements", e.target.value)}
                className="form-control"
                rows="4"
                placeholder="Enter job requirements..."
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Benefits & Perks</label>
              <textarea
                value={formData.benefits}
                onChange={(e) => handleChange("benefits", e.target.value)}
                className="form-control"
                rows="4"
                placeholder="Enter benefits and perks..."
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Qualifications *</label>
              <textarea
                value={formData.qualifications}
                onChange={(e) => handleChange("qualifications", e.target.value)}
                className="form-control"
                rows="4"
                placeholder="Enter qualifications and requirements..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "1rem", fontSize: "1rem" }}
            >
              {loading ? "Updating..." : "Update Job"}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

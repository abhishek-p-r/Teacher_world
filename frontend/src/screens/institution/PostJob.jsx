import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuthToken, refreshAccessToken } from '../../lib/auth'
import { API_URL } from '../../config/api'

export default function InstitutionPostJob() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    qualifications: "",
    city: "",
    state: "",
    pinCode: "",
    salaryRange: "",
    startDate: "",
    deadline: "",
    employmentType: "full-time",
    latitude: "",
    longitude: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Ensure current user is an institution
      let currentUser = null
      try { currentUser = JSON.parse(localStorage.getItem('user')) } catch (e) { /* ignore */ }
      if (!currentUser || currentUser.role !== 'institution') {
        setError('Only institution accounts can post jobs. Please sign in with an institution account.')
        setLoading(false)
        return
      }
      const token = getAuthToken()
      if (!token) {
        setError("Authentication required")
        return
      }

      // Ensure we have latitude/longitude. Try browser geolocation if missing.
      const getPosition = () =>
        new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          )
        })

      // Fallback geocode using OpenStreetMap Nominatim when geolocation fails
      const geocodeFromAddress = async (pinCode, city, state) => {
        try {
          const parts = [pinCode, city, state].filter(Boolean).join(' ')
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

      const payload = { ...formData }
      // Normalize manual latitude/longitude if provided as strings
      const hasLat = payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== ''
      const hasLng = payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== ''
      if (hasLat) payload.latitude = Number.parseFloat(payload.latitude)
      if (hasLng) payload.longitude = Number.parseFloat(payload.longitude)

      // If we don't have both coordinates yet, try geolocation and geocoding
      if (!hasLat || !hasLng) {
        // Try browser geolocation first
        let coords = null
        try {
          coords = await getPosition()
        } catch (err) {
          // ignore - try geocode fallback
        }

        if (!coords) {
          // Attempt to geocode using pinCode/city/state
          const geo = await geocodeFromAddress(payload.pinCode, payload.city, payload.state)
          if (geo) {
            payload.latitude = geo.latitude
            payload.longitude = geo.longitude
          } else {
            setError('Unable to determine location. Please allow location access or provide latitude and longitude.')
            setLoading(false)
            return
          }
        } else {
          payload.latitude = coords.latitude
          payload.longitude = coords.longitude
        }
      }

      const doPost = async (tokenToUse) => {
        return fetch(`${API_URL}/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenToUse}`
          },
          body: JSON.stringify(payload)
        })
      }

      let response = await doPost(token)

      // If token invalid/expired, try refresh once
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        if ((errorData.message || '').toLowerCase().includes('invalid') || (errorData.message || '').toLowerCase().includes('expired')) {
          const newToken = await refreshAccessToken()
          if (newToken) {
            response = await doPost(newToken)
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to post job')
      }

      const result = await response.json()
      setSuccess("Job posted successfully!")

      // Redirect to jobs management page after successful posting
      setTimeout(() => {
        navigate('/institution/jobs')
      }, 2000)

      setFormData({
        title: "",
        description: "",
        subject: "",
        qualifications: "",
        city: "",
        state: "",
        pinCode: "",
        salaryRange: "",
        startDate: "",
        deadline: "",
        employmentType: "full-time",
        latitude: "",
        longitude: "",
      })
    } catch (err) {
      console.error('Error posting job:', err)
      setError(err.message || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/institution/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        <h1>Post a Job</h1>
        <p>Fill in the details to attract the best teachers</p>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '1rem', margin: '1rem 0', borderRadius: '0.5rem' }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', margin: '1rem 0', borderRadius: '0.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Job Title *</label>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Subject *</label>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="e.g., Mumbai"
                className="form-control"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>State *</label>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Salary Range</label>
              <input
                type="text"
                value={formData.salaryRange}
                onChange={(e) => handleChange("salaryRange", e.target.value)}
                placeholder="e.g., $40,000 - $60,000 USD"
                className="form-control"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleChange("employmentType", e.target.value)}
                className="form-control"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="form-control"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Application Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleChange("deadline", e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Job Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="form-control"
              rows="5"
              placeholder="Describe the job role and responsibilities..."
              required
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Qualifications *</label>
            <textarea
              value={formData.qualifications}
              onChange={(e) => handleChange("qualifications", e.target.value)}
              className="form-control"
              rows="4"
              placeholder="Enter qualifications and requirements..."
              required
            />
          </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Pin Code *</label>
              <input
                type="text"
                value={formData.pinCode}
                onChange={(e) => handleChange("pinCode", e.target.value)}
                placeholder="e.g., 560001"
                className="form-control"
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Latitude (optional)</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => handleChange("latitude", e.target.value)}
                  placeholder="e.g., 12.9716"
                  className="form-control"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Longitude (optional)</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => handleChange("longitude", e.target.value)}
                  placeholder="e.g., 77.5946"
                  className="form-control"
                />
              </div>
            </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  )
}

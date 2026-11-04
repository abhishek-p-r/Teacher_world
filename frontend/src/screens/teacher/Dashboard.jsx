import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAuthToken } from '../../lib/auth'
import { API_URL, BASE_URL } from '../../config/api'


export default function TeacherDashboardScreen() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeacherProfile()
  }, [])

  const fetchTeacherProfile = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_URL}/profile/teacher`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const normalizeUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    const base = API_URL.replace(/\/api\/?$/i, "")
    if (url.startsWith("/")) return `${base}${url}`
    return `${base}/${url}`
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', background: 'var(--gray-50)', minHeight: '100vh' }}>
        <div className="container">
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ddd' }}>
            {profile?.photo ? (
              <img
                src={normalizeUrl(profile.photo)}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/placeholder.jpg'
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                👤
              </div>
            )}
          </div>
          <div>
            <h1>Welcome back, {profile?.name || 'Teacher'}!</h1>
            <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Profile strength: {profile ? 'Strong' : 'Building'} • Applied jobs: {profile?.appliedJobsCount || 0} • Shortlisted: {profile?.shortlistedCount || 0} • Recommended jobs: {profile?.recommendedJobsCount || 0}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/teacher/profile" className="btn btn-primary">Update Profile</Link>
          <Link to="/teacher/applications" className="btn btn-secondary">My Applications</Link>
          <Link to="/teacher/settings" className="btn btn-outline">Settings</Link>
        </div>
      </div>
    </div>
  )
}

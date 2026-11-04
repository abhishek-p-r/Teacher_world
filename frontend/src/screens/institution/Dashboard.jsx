import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAuthToken } from '../../lib/auth'
import { API_URL, BASE_URL } from '../../config/api'


export default function InstitutionDashboardScreen() {
  const [profile, setProfile] = useState(null)
  const [jobsStats, setJobsStats] = useState({ active: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInstitutionProfile()
    fetchJobsStats()
  }, [])

  // Add a refresh function that can be called after photo upload
  const refreshProfile = () => {
    fetchInstitutionProfile()
  }

  // Expose refresh function to window for profile component to call
  useEffect(() => {
    window.refreshInstitutionDashboard = refreshProfile
    return () => {
      delete window.refreshInstitutionDashboard
    }
  }, [])

  const fetchInstitutionProfile = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_URL}/profile/institution`, {
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

  const fetchJobsStats = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_URL}/jobs/institution`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const jobs = await response.json()
        const activeJobs = jobs.filter(job => job.status === 'active').length
        setJobsStats({ active: activeJobs, total: jobs.length })
      }
    } catch (error) {
      console.error('Error fetching jobs stats:', error)
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
                alt="Institution Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/placeholder-logo.png'
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                🏫
              </div>
            )}
          </div>
          <div>
            <h1>Welcome back, {profile?.institutionName || 'Institution'}!</h1>
            <p>You have {jobsStats.active} active jobs out of {jobsStats.total} total jobs posted.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/institution/post-job" className="btn btn-primary">Post Job</Link>
          <Link to="/institution/search-teachers" className="btn btn-secondary">Search Teachers</Link>
          <Link to="/institution/profile" className="btn btn-outline">Update Profile</Link>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { API_URL, BASE_URL } from '../../config/api'


// Helper to ensure URLs returned from the API are absolute so the browser can load them
const normalizeUrl = (url) => {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  const base = API_URL.replace(/\/api\/?$/i, "")
  if (url.startsWith("/")) return `${base}${url}`
  return `${base}/${url}`
}

export default function TeacherProfileScreen() {
  const [profile, setProfile] = useState(null)
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    fetchTeacherProfile()

    // Listen for profile updates (e.g., photo changes)
    const handleProfileUpdate = () => {
      fetchTeacherProfile()
    }

    window.addEventListener("teacherProfileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("teacherProfileUpdated", handleProfileUpdate)
    }
  }, [])

  const fetchTeacherProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const prof = await response.json()
      if (prof.photo) prof.photo = normalizeUrl(prof.photo)
      setProfile(prof)
    } catch (error) {
      console.error("Failed to fetch teacher profile:", error.message)
    }
  }

  return (
    <div style={{ padding: '2rem', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <img
            src={profile?.photo || '/placeholder.jpg'}
            alt="Profile Photo"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: '1rem'
            }}
          />
          <div>
            <h1>{profile?.name || 'Teacher Profile'}</h1>
            <p>Basic info, professional info, education, job preferences, resume and availability.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

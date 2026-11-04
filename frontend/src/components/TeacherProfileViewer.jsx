import { useState, useEffect } from 'react'
import { X, Download, Mail, Phone, MapPin, Briefcase, Award, FileText } from 'lucide-react'
import axios from 'axios'

import { API_URL } from "../config/api"

export default function TeacherProfileViewer({ teacherId, token, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/profile/teacher/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProfile(response.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching teacher profile:', err)
        setError(err.response?.data?.message || 'Failed to load teacher profile')
      } finally {
        setLoading(false)
      }
    }

    if (teacherId && token) {
      fetchTeacherProfile()
    }
  }, [teacherId, token])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#d32f2f' }}>
        <p>{error}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Profile not found</p>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'sticky',
            top: 0,
            right: 0,
            background: 'white',
            border: 'none',
            padding: '1rem',
            cursor: 'pointer',
            fontSize: '1.5rem',
            float: 'right'
          }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem', paddingRight: '3rem' }}>
            {profile.photo && (
              <img
                src={profile.photo}
                alt={profile.name}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  marginBottom: '1rem',
                  objectFit: 'cover'
                }}
              />
            )}
            <h2 style={{ margin: '0.5rem 0', color: '#1a5490', fontSize: '1.75rem' }}>
              {profile.name}
            </h2>
            <p style={{ color: '#666', margin: '0.5rem 0' }}>{profile.title || 'Teacher'}</p>

            {/* Quick Info */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {profile.email && (
                <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a5490', textDecoration: 'none' }}>
                  <Mail size={18} /> {profile.email}
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a5490', textDecoration: 'none' }}>
                  <Phone size={18} /> {profile.phone}
                </a>
              )}
            </div>
          </div>

          {/* Location */}
          {(profile.city || profile.state) && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a5490', marginBottom: '0.5rem' }}>
                <MapPin size={20} /> Location
              </h3>
              <p style={{ color: '#666' }}>
                {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* Experience */}
          {profile.experience && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a5490', marginBottom: '0.5rem' }}>
                <Briefcase size={20} /> Experience
              </h3>
              <p style={{ color: '#666', whiteSpace: 'pre-wrap' }}>{profile.experience}</p>
            </div>
          )}

          {/* Subjects */}
          {profile.subjects && profile.subjects.length > 0 && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a5490', marginBottom: '0.5rem' }}>
                <Award size={20} /> Subjects
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {profile.subjects.map((subject, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#e3f2fd',
                      color: '#1a5490',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {profile.qualifications && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a5490', marginBottom: '0.5rem' }}>
                <Award size={20} /> Qualifications
              </h3>
              <p style={{ color: '#666', whiteSpace: 'pre-wrap' }}>{profile.qualifications}</p>
            </div>
          )}

          {/* Bio/Summary */}
          {profile.bio && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a5490', marginBottom: '0.5rem' }}>
                <FileText size={20} /> About
              </h3>
              <p style={{ color: '#666', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{profile.bio}</p>
            </div>
          )}

          {/* Resume Download */}
          {profile.resumeUrl && (
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
              <a
                href={profile.resumeUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#1a5490',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.25rem',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                <Download size={18} /> Download Resume
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

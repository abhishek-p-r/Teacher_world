import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAuthUser } from '../../lib/auth'
import { API_URL } from '../../config/api'

export default function InstitutionApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState(null)
  const [messageData, setMessageData] = useState('')
  const [interviewData, setInterviewData] = useState({
    scheduledDate: '',
    duration: 60,
    meetingType: 'online',
    meetingLink: '',
    location: '',
    notes: ''
  })
  const { user } = getAuthUser()

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${API_URL}/applications/institution/applications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId, status, notes = '') => {
    try {
      const response = await fetch(`${API_URL}/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, notes })
      })

      if (response.ok) {
        fetchApplications()
      }
    } catch (error) {
      console.error('Error updating application status:', error)
    }
  }

  const scheduleInterview = async (e) => {
    e.preventDefault()
    if (!selectedApplication) return

    try {
      const response = await fetch(`${API_URL}/interviews/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          applicationId: selectedApplication._id,
          ...interviewData,
          scheduledDate: new Date(interviewData.scheduledDate).toISOString()
        })
      })

      if (response.ok) {
        setShowScheduleModal(false)
        setSelectedApplication(null)
        setInterviewData({
          scheduledDate: '',
          duration: 60,
          meetingType: 'online',
          meetingLink: '',
          location: '',
          notes: ''
        })
        fetchApplications()
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!selectedApplication || !messageData.trim()) return

    try {
      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId: selectedApplication.teacherId.userId,
          content: messageData,
          applicationId: selectedApplication._id
        })
      })

      if (response.ok) {
        setShowMessageModal(false)
        setSelectedApplication(null)
        setMessageData('')
        alert('Message sent successfully!')
      } else {
        alert('Failed to send message.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return '#f59e0b'
      case 'shortlisted': return '#3b82f6'
      case 'interview-scheduled': return '#8b5cf6'
      case 'accepted': return '#10b981'
      case 'rejected': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', background: 'var(--gray-50)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>Loading applications...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container">
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/institution/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Applications</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">All Status</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview-scheduled">Interview Scheduled</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            No applications received yet
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {applications.map((application) => (
              <div key={application._id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: '#1f2937' }}>
                        {application.teacherId?.name || 'Unknown Teacher'}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: getStatusColor(application.status),
                        color: 'white'
                      }}>
                        {application.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>
                      Applied for: <strong>{application.jobId?.title || 'Unknown Position'}</strong>
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>
                      Applied on: {formatDate(application.createdAt)}
                    </p>
                    {application.coverLetter && (
                      <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                        <strong>Cover Letter:</strong> {application.coverLetter}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {application.status === 'applied' && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(application._id, 'shortlisted')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(application._id, 'rejected')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setApplicationToDelete(application)
                            setShowDeleteModal(true)
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}

                    {application.status === 'shortlisted' && (
                      <button
                        onClick={() => {
                          setSelectedApplication(application)
                          setShowScheduleModal(true)
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Schedule Interview
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedApplication(application)
                        setShowMessageModal(true)
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Send Message
                    </button>

                    <Link
                      to={`/institution/teacher-profile/${application.teacherId?._id}`}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#6b7280',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        display: 'inline-block'
                      }}
                    >
                      View Profile
                    </Link>
                  </div>
                </div>

                {/* Application History */}
                {application.statusHistory && application.statusHistory.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151' }}>Status History</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {application.statusHistory.map((history, index) => (
                        <div key={index} style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          <strong>{history.status.replace('-', ' ').toUpperCase()}</strong> - {formatDate(history.timestamp)}
                          {history.notes && ` - ${history.notes}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showScheduleModal && selectedApplication && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90vw'
            }}>
              <h3 style={{ marginTop: 0 }}>Schedule Interview</h3>
              <p>Schedule an interview with {selectedApplication.teacherId?.name}</p>

              <form onSubmit={scheduleInterview}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewData.scheduledDate}
                    onChange={(e) => setInterviewData({...interviewData, scheduledDate: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Duration (minutes)
                  </label>
                  <select
                    value={interviewData.duration}
                    onChange={(e) => setInterviewData({...interviewData, duration: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Meeting Type
                  </label>
                  <select
                    value={interviewData.meetingType}
                    onChange={(e) => setInterviewData({...interviewData, meetingType: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {interviewData.meetingType === 'online' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={interviewData.meetingLink}
                      onChange={(e) => setInterviewData({...interviewData, meetingLink: e.target.value})}
                      placeholder="https://zoom.us/..."
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                )}

                {interviewData.meetingType === 'offline' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={interviewData.location}
                      onChange={(e) => setInterviewData({...interviewData, location: e.target.value})}
                      placeholder="Office address"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Notes
                  </label>
                  <textarea
                    value={interviewData.notes}
                    onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})}
                    placeholder="Additional notes for the interview"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleModal(false)
                      setSelectedApplication(null)
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Schedule Interview
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {showMessageModal && selectedApplication && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90vw'
            }}>
              <h3 style={{ marginTop: 0 }}>Send Message</h3>
              <p>Send a message to {selectedApplication.teacherId?.name}</p>

              <form onSubmit={sendMessage}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Message
                  </label>
                  <textarea
                    value={messageData}
                    onChange={(e) => setMessageData(e.target.value)}
                    placeholder="Type your message here..."
                    rows={5}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMessageModal(false)
                      setSelectedApplication(null)
                      setMessageData('')
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Application Modal */}
        {showDeleteModal && applicationToDelete && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90vw'
            }}>
              <h3 style={{ marginTop: 0, color: '#dc2626' }}>Delete Application</h3>
              <p>Are you sure you want to delete the application from <strong>{applicationToDelete.teacherId?.name}</strong> for the position <strong>{applicationToDelete.jobId?.title}</strong>?</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setApplicationToDelete(null)
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API_URL}/applications/institution/${applicationToDelete._id}`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                      })

                      if (response.ok) {
                        setShowDeleteModal(false)
                        setApplicationToDelete(null)
                        fetchApplications()
                        alert('Application deleted successfully!')
                      } else {
                        alert('Failed to delete application.')
                      }
                    } catch (error) {
                      console.error('Error deleting application:', error)
                      alert('Error deleting application.')
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

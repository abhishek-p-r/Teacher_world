import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Video, AlertCircle } from 'lucide-react';
import { API_URL } from '../config/api';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '24px',
  },
  maxWidth: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a5490',
    marginBottom: '16px',
  },
  subheading: {
    fontSize: '16px',
    color: '#4b5563',
    marginBottom: '24px',
  },
  infoBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    color: '#166534',
  },
  meetingDetails: {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  detailLabel: {
    color: '#4b5563',
    fontWeight: '500',
  },
  detailValue: {
    color: '#111827',
    fontWeight: '600',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    flexWrap: 'wrap',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  primaryButton: {
    backgroundColor: '#1a5490',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    color: 'white',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px',
    color: '#991b1b',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  loadingSpinner: {
    border: '4px solid rgba(0,0,0,0.1)',
    borderTop: '4px solid #1a5490',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    animation: 'spin 1s linear infinite',
  },
};

export default function Zoom() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (interviewId) {
      fetchMeetingDetails();
    }
  }, [interviewId]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/interviews/${interviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch interview details');

      const interview = await res.json();
      setMeeting(interview);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const createZoomMeeting = async () => {
    try {
      setCreating(true);
      setError(null);

      const meetingDateTime = new Date(meeting.scheduledDate).toISOString();

      const res = await fetch(`${API_URL}/zoom/create-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interviewId,
          topic: `Interview - ${meeting.position || 'Session'}`,
          startTime: meetingDateTime,
          duration: 60,
        }),
      });

      if (!res.ok) throw new Error('Failed to create Zoom meeting');

      const data = await res.json();
      const updatedMeeting = {
        ...meeting,
        zoomMeetingId: data.meeting.meetingId,
        zoomJoinUrl: data.meeting.joinUrl,
      };

      setMeeting(updatedMeeting);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create Zoom meeting');
    } finally {
      setCreating(false);
    }
  };

  const joinZoomMeeting = () => {
    if (meeting?.zoomJoinUrl) {
      window.open(meeting.zoomJoinUrl, '_blank');
    }
  };

  const copyMeetingLink = () => {
    if (meeting?.zoomJoinUrl) {
      navigator.clipboard.writeText(meeting.zoomJoinUrl);
      alert('Meeting link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.maxWidth}>
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <div style={styles.loadingSpinner} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={styles.container}>
        <div style={styles.maxWidth}>
          <div style={styles.card}>
            <h1 style={styles.heading}>Interview Not Found</h1>
            <p style={styles.subheading}>The interview details could not be loaded.</p>
            <button
              onClick={() => navigate(-1)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Zoom Meeting Setup</h1>
          <p style={styles.subheading}>Manage your Zoom interview meeting</p>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle style={{ height: '20px', width: '20px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={styles.infoBox}>
            {meeting.zoomJoinUrl
              ? '✓ Zoom meeting is ready to join'
              : 'Create a Zoom meeting to start your interview session'}
          </div>

          <div style={styles.meetingDetails}>
            <div style={{ ...styles.detailItem, borderBottom: meeting.position ? '1px solid #e5e7eb' : 'none' }}>
              <span style={styles.detailLabel}>Position:</span>
              <span style={styles.detailValue}>{meeting.position || 'N/A'}</span>
            </div>

            {meeting.position && (
              <div style={{ ...styles.detailItem, borderBottom: meeting.scheduledDate ? '1px solid #e5e7eb' : 'none' }}>
                <span style={styles.detailLabel}>Scheduled Date:</span>
                <span style={styles.detailValue}>
                  {new Date(meeting.scheduledDate).toLocaleString()}
                </span>
              </div>
            )}

            {meeting.scheduledDate && (
              <div style={{ ...styles.detailItem, borderBottom: meeting.zoomJoinUrl ? '1px solid #e5e7eb' : 'none' }}>
                <span style={styles.detailLabel}>Status:</span>
                <span style={styles.detailValue}>
                  {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                </span>
              </div>
            )}

            {meeting.zoomJoinUrl && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Meeting ID:</span>
                <span style={styles.detailValue}>{meeting.zoomMeetingId}</span>
              </div>
            )}
          </div>

          {meeting.zoomJoinUrl && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <p style={{ color: '#1d4ed8', fontWeight: '500', marginBottom: '8px' }}>Meeting Link:</p>
              <p style={{
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '6px',
                wordBreak: 'break-all',
                color: '#111827',
                fontSize: '14px',
              }}>
                {meeting.zoomJoinUrl}
              </p>
            </div>
          )}

          <div style={styles.buttonGroup}>
            {!meeting.zoomJoinUrl ? (
              <button
                onClick={createZoomMeeting}
                disabled={creating}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: creating ? 0.6 : 1,
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating && <div style={{ ...styles.loadingSpinner, width: '16px', height: '16px' }} />}
                {creating ? 'Creating...' : 'Create Zoom Meeting'}
              </button>
            ) : (
              <>
                <button
                  onClick={joinZoomMeeting}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  <Video style={{ height: '20px', width: '20px' }} />
                  Join Meeting
                </button>
                <button
                  onClick={copyMeetingLink}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Copy Link
                </button>
              </>
            )}

            <button
              onClick={() => navigate(-1)}
              style={{ ...styles.button, ...styles.dangerButton }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
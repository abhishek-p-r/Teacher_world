import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import { Phone, Video } from 'lucide-react';

import { API_URL } from "../config/api";

const styles = {
  container: {
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: '#000',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '16px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))',
    color: 'white',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  controlButton: {
    backgroundColor: '#1a5490',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
  },
  muteButton: {
    backgroundColor: '#f59e0b',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#1f2937',
    color: 'white',
  },
  spinner: {
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '24px',
    textAlign: 'center',
  },
};

export default function InterviewVideo() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [callFrame, setCallFrame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAudioOff, setIsAudioOff] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const frameContainer = useRef(null);

  useEffect(() => {
    if (!roomName) {
      setError('No room specified');
      setLoading(false);
      return;
    }

    const joinRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');

        // Get token from backend
        const res = await fetch(`${API_URL}/live-interviews/join/${roomName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to join room');
        }

        const data = await res.json();

        // Create Daily iframe
        const df = DailyIframe.createFrame({
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: 'none',
            top: '0',
            left: '0',
            zIndex: 1000,
          },
        });

        setCallFrame(df);

        // Join room with token
        await df.join({
          url: `https://${import.meta.env.VITE_DAILY_DOMAIN || 'your-domain'}.daily.co/${roomName}`,
          token: data.token,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error joining room:', err);
        setError(err.message || 'Failed to join meeting room');
        setLoading(false);
      }
    };

    joinRoom();

    return () => {
      if (callFrame) {
        callFrame.destroy();
        setCallFrame(null);
      }
    };
  }, [roomName]);

  const handleLeaveCall = async () => {
    if (callFrame) {
      await callFrame.leave();
      callFrame.destroy();
      setCallFrame(null);
    }
    navigate(-1);
  };

  const toggleAudio = async () => {
    if (callFrame) {
      if (isAudioOff) {
        await callFrame.updateInputSettings({
          audio: { processor: { type: 'none' } },
        });
      } else {
        await callFrame.updateInputSettings({
          audio: true,
        });
      }
      setIsAudioOff(!isAudioOff);
    }
  };

  const toggleVideo = async () => {
    if (callFrame) {
      if (isVideoOff) {
        await callFrame.updateInputSettings({
          video: true,
        });
      } else {
        await callFrame.updateInputSettings({
          video: false,
        });
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={{ marginBottom: '16px' }}>Unable to Join Meeting</h2>
        <p style={{ marginBottom: '24px' }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={{ marginTop: '16px' }}>Connecting to meeting...</p>
        </div>
      )}

      <div style={styles.videoContainer} ref={frameContainer}>
        {!loading && (
          <>
            <div style={styles.topBar}>
              <div style={styles.title}>
                Interview Session
              </div>
              <span style={{ fontSize: '14px', opacity: 0.9 }}>
                {roomName}
              </span>
            </div>

            <div style={styles.controlBar}>
              <button
                style={{
                  ...styles.controlButton,
                  ...(isAudioOff ? styles.muteButton : {}),
                }}
                onClick={toggleAudio}
                title={isAudioOff ? 'Unmute' : 'Mute'}
              >
                🎤 {isAudioOff ? 'Unmuted' : 'Mute'}
              </button>

              <button
                style={{
                  ...styles.controlButton,
                  ...(isVideoOff ? styles.muteButton : {}),
                }}
                onClick={toggleVideo}
                title={isVideoOff ? 'Turn on video' : 'Turn off video'}
              >
                <Video style={{ height: '20px', width: '20px' }} />
                {isVideoOff ? 'Video On' : 'Video Off'}
              </button>

              <button
                style={{ ...styles.controlButton, ...styles.leaveButton }}
                onClick={handleLeaveCall}
                title="Leave meeting"
              >
                <Phone style={{ height: '20px', width: '20px' }} />
                Leave
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
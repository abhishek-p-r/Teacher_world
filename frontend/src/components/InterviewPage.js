import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom"; // Assuming you use React Router

import { API_URL } from "../config/api";

const InterviewPage = () => {
  // Get applicationId from URL, e.g., /applications/:applicationId/schedule-interview
  const { applicationId } = useParams();

  const [applicationDetails, setApplicationDetails] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isZoomAuthenticated, setIsZoomAuthenticated] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form state
  const [topic, setTopic] = useState("Candidate Interview");
  const [startTime, setStartTime] = useState("");

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsSuccess(false);
    setMeetingDetails(null);

    // Format date for Zoom API (YYYY-MM-DDTHH:mm:ss)
    const isoTime = new Date(startTime).toISOString().slice(0, 19);

    try {
      // Pass the applicationId to the backend
      const response = await axios.post(`${API_URL}/interviews/schedule`, {
        topic,
        start_time: isoTime,
        duration: 30, // Example: 30 minutes
        applicationId: applicationId,
      });

      if (response.data.success) {
        setMeetingDetails(response.data.interview);
        setIsSuccess(true);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "An unexpected error occurred.";
      setError(errorMessage);
      console.error("Scheduling error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!applicationId) {
      setError("No application selected. Please access this page from an application's details.");
      return;
    }

    // Check for the query parameter from the Zoom OAuth redirect
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("status") === "zoom_success") {
      setIsZoomAuthenticated(true);
    }

    const fetchApplicationDetails = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/applications/${applicationId}`);
        if (data.success) {
          setApplicationDetails(data.application);
          // Pre-fill the topic with candidate and job info
          if (data.application.teacherId && data.application.jobId) {
            setTopic(`Interview for ${data.application.teacherId.name} - ${data.application.jobId.title}`);
          }
        } else {
          setError(data.message || "Could not fetch application details.");
        }
      } catch (err) {
        setError("Failed to load application details.");
      }
    };
    fetchApplicationDetails();
  }, [applicationId]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Interview Scheduling</h1>

      {/* --- REALISTIC UX FIX: Step 1: Zoom Login via Redirect --- */}
      <p>First, connect your Zoom account.</p>
      <button
        onClick={() => {
          // Save the current page URL to return to it after auth
          localStorage.setItem('zoomAuthRedirect', window.location.pathname);
          const base = API_URL.replace(/\/api\/?$/i, "");
          window.location.href = `${base}/api/zoom/login`;
        }}
        disabled={isZoomAuthenticated}
      >
        {isZoomAuthenticated ? "✓ Zoom Authenticated" : "Login with Zoom"}
      </button>
      {isZoomAuthenticated && <p style={{ color: 'green' }}>You can now schedule a meeting.</p>}

      <hr style={{ margin: "2rem 0" }} />

      {/* Step 2: Schedule Form (only show if Zoom is authenticated) */}
      {applicationId && !isSuccess && isZoomAuthenticated && (
        <>
          {applicationDetails ? (
            <>
              <h2>Schedule Interview</h2>
              <p><strong>Candidate:</strong> {applicationDetails.teacherId?.name}</p>
              <p><strong>Institution:</strong> {applicationDetails.institutionId?.institutionName}</p>
            </>
          ) : (
            <h2>Loading Application Details...</h2>
          )}

          <form onSubmit={handleScheduleInterview}>
            <div>
              <label>Topic: </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label>Start Time: </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading ? "Scheduling..." : "Schedule & Create Zoom Meeting"}
            </button>
          </form>
        </>
      )}

      {/* Step 3: Display Results */}
      {error && <p style={{ color: "red", marginTop: "1rem" }}>Error: {error}</p>}

      {isSuccess && meetingDetails && (
        <div style={{ marginTop: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
          <h3>Interview Scheduled Successfully!</h3>
          <p><strong>Institution:</strong> {meetingDetails.institution.institutionName}</p>
          <p><strong>Candidate:</strong> {meetingDetails.teacher.name}</p>
          <p>The application status has been updated.</p>
          <p><strong>Start Time:</strong> {new Date(meetingDetails.scheduledDate).toLocaleString()}</p>
          <p><strong>Join Link:</strong> <a href={meetingDetails.zoomJoinUrl} target="_blank" rel="noopener noreferrer">{meetingDetails.zoomJoinUrl}</a></p>
          <br />
          <Link to={`/applications/${applicationId}`}>
            Go back to Application Details
          </Link>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
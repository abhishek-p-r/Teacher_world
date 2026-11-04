import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { API_URL, BASE_URL } from '../../config/api'


// Helper to ensure URLs returned from the API are absolute so the browser can load them
const normalizeUrl = (url) => {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  const base = API_URL.replace(/\/api\/?$/i, "")
  if (url.startsWith("/")) return `${base}${url}`
  return `${base}/${url}`
}

export default function InstitutionProfileScreen() {
  const [profile, setProfile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadStatus, setUploadStatus] = useState({})
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    fetchInstitutionProfile()

    // Listen for profile updates (e.g., photo changes)
    const handleProfileUpdate = () => {
      fetchInstitutionProfile()
    }

    window.addEventListener("institutionProfileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("institutionProfileUpdated", handleProfileUpdate)
    }
  }, [])

  const fetchInstitutionProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/institution`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const prof = await response.json()
      if (prof.photo) prof.photo = normalizeUrl(prof.photo)
      setProfile(prof)
      if (prof.photo) {
        setPhotoPreview(prof.photo)
      }
    } catch (error) {
      console.error("Failed to fetch institution profile:", error.message)
    }
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG)")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo size exceeds 5MB limit")
      return
    }

    setUploadStatus((prev) => ({ ...prev, photo: "uploading" }))
    setError("")

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target.result)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append("photo", file)

      const response = await fetch(`${API_URL}/profile/institution/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload photo")
      }

      const result = await response.json()
      console.log("[v0] Photo uploaded successfully:", result)

      // Derive a usable absolute photo URL from the API response and update
      // local state so the page immediately reflects the change.
      const returnedUrl = result.photoUrl || result.profile?.photo || result.photo
      const photoUrl = normalizeUrl(returnedUrl)

      setProfile((prev) => ({
        ...prev,
        photo: photoUrl,
      }))
      setPhotoPreview(photoUrl)

      setUploadStatus((prev) => ({ ...prev, photo: "success" }))
      setMessage("Photo uploaded successfully!")

      // Refresh the dashboard if it's open
      if (window.refreshInstitutionDashboard) {
        window.refreshInstitutionDashboard()
      }

      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      console.error("[v0] Photo upload error:", err)
      setError(err.message || "Failed to upload photo")
      setUploadStatus((prev) => ({ ...prev, photo: "error" }))
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

        {message && (
          <div
            style={{
              background: "#d4edda",
              color: "#155724",
              padding: "1rem",
              margin: "1rem 0",
              borderRadius: "0.5rem",
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: "900px",
              marginTop: "1rem",
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "1rem",
              margin: "1rem 0",
              borderRadius: "0.5rem",
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: "900px",
              marginTop: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <img
            src={photoPreview || profile?.photo || '/placeholder-logo.png'}
            alt="Institution Logo"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: '1rem'
            }}
          />
          <div>
            <h1>{profile?.institutionName || 'Institution Profile'}</h1>
            <p>Logo, banner, info, HR contact, branch locations, gallery images.</p>
          </div>
        </div>

        {/* Photo Upload Section */}
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "#f9f9f9",
            borderRadius: "0.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: "#e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span style={{ fontSize: "3rem" }}>🏫</span>
              )}
              {/* Plus symbol overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "5px",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#007bff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => document.getElementById('photo-upload').click()}
              >
                +
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              <Upload size={18} style={{ marginRight: "0.5rem" }} />
              Upload Institution Logo
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="form-control"
              disabled={uploadStatus.photo === "uploading"}
              style={{ maxWidth: "300px", margin: "0 auto", display: "none" }}
            />
            {uploadStatus.photo === "uploading" && (
              <p style={{ color: "#1a5490", marginTop: "0.5rem" }}>Uploading...</p>
            )}
            {uploadStatus.photo === "success" && (
              <p style={{ color: "#28a745", marginTop: "0.5rem" }}>✓ Logo updated</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

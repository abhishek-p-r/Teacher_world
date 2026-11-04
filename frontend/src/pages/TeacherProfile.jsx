"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, FileText, CheckCircle, Trash2, Upload, Eye } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL, BASE_URL } from "../config/api"

const MARKS_TYPES = ["SSLC", "PUC", "Intermediate", "Diploma", "Bachelor", "Master", "PhD", "IB", "ICSE", "Other"]
const CERTIFICATE_TYPES = [
  "Teaching License",
  "B.Ed",
  "M.Ed",
  "PGDCA",
  "TCS",
  "IGNOU",
  "NPTEL",
  "Udemy",
  "Coursera",
  "Google Certified",
  "Microsoft Certified",
  "AWS Certified",
  "Other Professional",
]

export default function TeacherProfile() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("basic")
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    photo: null,
    bio: "",
    experience: 0,
    subjects: [],
    classesLevel: [],
    specializations: [],
    skills: [],
    resume: null,
    resumeUrl: "",
    degrees: [],
    certificates: [],
    certificateUrls: [],
    marksCards: [],
    expectedSalary: "",
    preferredLocations: [],
    jobType: [],
    remoteAvailable: false,
    preferredShifts: [],
    currentAddress: "",
    readyToRelocate: false,
    availability: "",
  })

  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState({})
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [selectedMarksType, setSelectedMarksType] = useState("SSLC")
  const [selectedCertType, setSelectedCertType] = useState("Teaching License")
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const token = localStorage.getItem("accessToken")

  // Normalize URLs coming from the API: if the server returns a relative path
  // like `/uploads/...` convert it to an absolute URL using the API base.
  const normalizeUrl = (url) => {
    if (!url) return url
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith("/")) return `${BASE_URL}${url}`
    return `${BASE_URL}/${url}`
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log("[v0] Profile fetched:", response.data)
      // Ensure photo URL is absolute so previews and other pages can use it.
      const prof = { ...response.data }
      if (prof.photo) prof.photo = normalizeUrl(prof.photo)
      setProfile(prof)
      if (prof.photo) {
        setPhotoPreview(prof.photo)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch profile:", error)
      setError("Failed to load profile. Please try again.")
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

      const response = await axios.post(`${API_URL}/profile/teacher/photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("[v0] Photo uploaded successfully:", response.data)

      // Derive a usable absolute photo URL from the API response and update
      // local state + localStorage so other pages (dashboard) can immediately
      // reflect the change without a full refresh.
      const returnedUrl = response.data.photoUrl || response.data.profile?.photo || response.data.photo
      const photoUrl = normalizeUrl(returnedUrl)

      setProfile((prev) => ({
        ...prev,
        photo: photoUrl,
      }))
      setPhotoPreview(photoUrl)

      // Persist and broadcast the update so other tabs/components update live
      try {
        const cached = JSON.parse(localStorage.getItem("teacherProfile") || "{}")
        const merged = { ...cached, photo: photoUrl }
        localStorage.setItem("teacherProfile", JSON.stringify(merged))

        // Also update the user object in localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        user.profilePhoto = photoUrl
        localStorage.setItem("user", JSON.stringify(user))

        window.dispatchEvent(new CustomEvent("teacherProfileUpdated", { detail: merged }))
      } catch (e) {
        // ignore storage errors
      }

      setUploadStatus((prev) => ({ ...prev, photo: "success" }))
      setMessage("Photo uploaded successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      console.error("[v0] Photo upload error:", err)
      setError(err.response?.data?.message || "Failed to upload photo")
      setUploadStatus((prev) => ({ ...prev, photo: "error" }))
    }
  }

  const handleFileUpload = async (event, fileType) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = {
      resume: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      marksCard: ["image/jpeg", "image/png", "application/pdf"],
      certificate: ["image/jpeg", "image/png", "application/pdf"],
    }

    if (!allowedTypes[fileType]?.includes(file.type)) {
      setError(`Invalid file type for ${fileType}. Please upload a valid file.`)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit")
      return
    }

    setUploadStatus((prev) => ({ ...prev, [fileType]: "uploading" }))
    setError("")

    try {
      const formData = new FormData()
      formData.append(fileType, file)

      if (fileType === "marksCard") {
        formData.append("marksType", selectedMarksType)
      }

      const endpoint =
        fileType === "resume"
          ? "/profile/teacher/resume"
          : fileType === "marksCard"
            ? "/profile/teacher/marks-card"
            : "/profile/teacher/certificate"

      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log(`[v0] ${fileType} uploaded:`, response.data)

      const updatedProfile = response.data.profile || response.data
      setProfile((prev) => ({
        ...prev,
        resumeUrl: updatedProfile.resumeUrl || prev.resumeUrl,
        marksCards: updatedProfile.marksCards || prev.marksCards,
        certificateUrls: updatedProfile.certificateUrls || prev.certificateUrls,
      }))

      setUploadStatus((prev) => ({ ...prev, [fileType]: "success" }))
      setMessage(`${fileType} uploaded successfully!`)
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      console.error(`[v0] ${fileType} upload error:`, err)
      setError(err.response?.data?.message || `Failed to upload ${fileType}`)
      setUploadStatus((prev) => ({ ...prev, [fileType]: "error" }))
    }
  }

  const handleSave = async () => {
    // Start loading states
    setLoading(true)
    setIsSaving(true)

    try {
      const response = await axios.put(`${API_URL}/profile/teacher`, profile, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const updatedProfile = response.data.profile || response.data
      console.log("[v0] Profile saved:", updatedProfile)

      // Update local state and persist so other pages (dashboard) can reflect changes without redirect
      const profToSet = { ...updatedProfile }
      if (profToSet.photo) profToSet.photo = normalizeUrl(profToSet.photo)
      setProfile(profToSet)
      try {
        localStorage.setItem("teacherProfile", JSON.stringify(profToSet))
      } catch (e) {
        /* ignore storage failures */
      }

      // Broadcast an event with the normalized profile so other pages update immediately
      try {
        const normalized = { ...profToSet }
        if (normalized.photo) normalized.photo = normalizeUrl(normalized.photo)
        window.dispatchEvent(new CustomEvent("teacherProfileUpdated", { detail: normalized }))
      } catch (e) {
        /* ignore in non-browser env */
      }

      // Show success message but stay on the same form (do not redirect). This avoids white flashes and keeps user in flow.
      setMessage("✓ Profile updated successfully! Changes will be visible on Dashboard.")
      setTimeout(() => setMessage(""), 2500)

      // Reset loading flags
      setLoading(false)
      setIsSaving(false)
    } catch (err) {
      console.error("[v0] Failed to save profile:", err)
      setError(err.response?.data?.message || "Failed to save profile. Please try again.")
      setLoading(false)
      setIsSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const getFileName = (url) => {
    if (!url) return "No file uploaded"
    return url.split("/").pop()
  }

  const removeMarksCard = async (index) => {
    const updatedMarksCards = profile.marksCards?.filter((_, i) => i !== index) || []
    setProfile((prev) => ({
      ...prev,
      marksCards: updatedMarksCards,
    }))
    setMessage("Marks card removed")
    setTimeout(() => setMessage(""), 2000)
  }

  const removeCertificate = async (index) => {
    const updatedCertificateUrls = profile.certificateUrls?.filter((_, i) => i !== index) || []
    setProfile((prev) => ({
      ...prev,
      certificateUrls: updatedCertificateUrls,
    }))
    setMessage("Certificate removed")
    setTimeout(() => setMessage(""), 2000)
  }

  return (
    <div style={{ background: "var(--gray-50)", minHeight: "100vh", position: "relative" }}>
      {isSaving && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "1rem",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <p style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Saving your profile...</p>
            <p style={{ color: "#999", margin: "0" }}>Please wait a moment</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <button onClick={handleSave} disabled={loading} className="btn btn-primary btn-sm">
            <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </nav>

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

      <section style={{ padding: "2rem 0", background: "var(--gray-50)", minHeight: "calc(100vh - 80px)" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <button onClick={() => navigate('/dashboard/teacher')} className="btn btn-secondary btn-sm" style={{ marginBottom: "1rem" }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          <div className="card" style={{ marginBottom: "2rem" }}>
            <h1>Edit Your Profile</h1>
            <p style={{ color: "#666" }}>Keep your profile updated to get better job opportunities</p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "2rem",
              borderBottom: "2px solid #e0e0e0",
              paddingBottom: "1rem",
              overflowX: "auto",
              background: "white",
              padding: "1rem",
              borderRadius: "0.5rem",
            }}
          >
            {["basic", "professional", "education", "preferences"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  background: activeTab === tab ? "#1a5490" : "transparent",
                  color: activeTab === tab ? "white" : "#666",
                  cursor: "pointer",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Basic Info */}
          {activeTab === "basic" && (
            <div className="card" style={{ background: "white", borderRadius: "0.5rem" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Basic Information</h2>

              {/* Profile Photo Upload Section */}
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
                  {photoPreview ? (
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Profile"
                      style={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid #1a5490",
                      }}
                    />
                  ) : (
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
                        fontSize: "4rem",
                      }}
                    >
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    <Upload size={18} style={{ marginRight: "0.5rem" }} />
                    Upload Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="form-control"
                    disabled={uploadStatus.photo === "uploading"}
                    style={{ maxWidth: "300px", margin: "0 auto" }}
                  />
                  {uploadStatus.photo === "uploading" && (
                    <p style={{ color: "#1a5490", marginTop: "0.5rem" }}>Uploading...</p>
                  )}
                  {uploadStatus.photo === "success" && (
                    <p style={{ color: "#28a745", marginTop: "0.5rem" }}>✓ Photo updated</p>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Full Name *</label>
                  <input
                    type="text"
                    value={profile.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Email *</label>
                  <input
                    type="email"
                    value={profile.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="form-control"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Phone Number *</label>
                  <input
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="form-control"
                    placeholder="Your phone number"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Current Location
                  </label>
                  <input
                    type="text"
                    value={profile.currentAddress || ""}
                    onChange={(e) => handleChange("currentAddress", e.target.value)}
                    className="form-control"
                    placeholder="City, State"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Bio / About</label>
                <textarea
                  value={profile.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="form-control"
                  rows="5"
                  placeholder="Tell us about yourself, your teaching philosophy, experience, and specializations..."
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>
            </div>
          )}

          {/* Professional Info */}
          {activeTab === "professional" && (
            <div className="card" style={{ background: "white", borderRadius: "0.5rem" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Professional Information</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={profile.experience || 0}
                    onChange={(e) => handleChange("experience", Number.parseInt(e.target.value) || 0)}
                    className="form-control"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Subjects Taught</label>
                  <input
                    type="text"
                    placeholder="e.g., Math, Physics, Chemistry"
                    value={profile.subjects && profile.subjects.length > 0 ? profile.subjects.join(", ") : ""}
                    onChange={(e) =>
                      handleChange(
                        "subjects",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Classes/Levels</label>
                  <select
                    multiple
                    value={profile.classesLevel || []}
                    onChange={(e) =>
                      handleChange(
                        "classesLevel",
                        Array.from(e.target.selectedOptions).map((option) => option.value),
                      )
                    }
                    className="form-control"
                    style={{ padding: "0.5rem", minHeight: "120px" }}
                  >
                    <option value="Preschool">Preschool</option>
                    <option value="1-5">Class 1-5</option>
                    <option value="6-10">Class 6-10</option>
                    <option value="11-12">Class 11-12</option>
                    <option value="College">College</option>
                    <option value="Competitive">Competitive Exams</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Specializations</label>
                  <input
                    type="text"
                    placeholder="e.g., IIT JEE, NEET, CBSE"
                    value={
                      profile.specializations && profile.specializations.length > 0
                        ? profile.specializations.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      handleChange(
                        "specializations",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                  Skills & Certifications
                </label>
                <input
                  type="text"
                  placeholder="e.g., Online Teaching, Curriculum Design, Student Mentoring"
                  value={profile.skills && profile.skills.length > 0 ? profile.skills.join(", ") : ""}
                  onChange={(e) =>
                    handleChange(
                      "skills",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  className="form-control"
                />
              </div>

              <h3
                style={{
                  marginBottom: "1.5rem",
                  marginTop: "2rem",
                  color: "#1a5490",
                  borderBottom: "2px solid #1a5490",
                  paddingBottom: "0.5rem",
                }}
              >
                📄 Documents & Certificates
              </h3>

              {/* Resume Upload */}
              <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f9f9f9", borderRadius: "0.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <label style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={20} /> Resume (PDF, DOC, DOCX)
                  </label>
                  {uploadStatus.resume === "success" && <CheckCircle size={20} color="green" />}
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "resume")}
                  className="form-control"
                  disabled={uploadStatus.resume === "uploading"}
                />
                {uploadStatus.resume === "uploading" && (
                  <p style={{ color: "#1a5490", marginTop: "0.5rem", fontSize: "0.875rem" }}>Uploading...</p>
                )}
                {profile.resumeUrl ? (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      color: "#28a745",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                    title="View Resume"
                    onClick={() => window.open(profile.resumeUrl, "_blank")}
                  >
                    <Eye size={16} />
                    Current: {getFileName(profile.resumeUrl)}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      color: "#e74c3c",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() => {
                      // Scroll to resume upload input for workaround/fix
                      const inputEl = document.querySelector('input[type="file"][accept=".pdf,.doc,.docx"]')
                      if (inputEl) inputEl.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    Fix It: Upload Resume
                  </div>
                )}
              </div>

              {/* Marks Cards Upload - CHANGED to support multiple mark types */}
              <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f9f9f9", borderRadius: "0.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <label style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={20} /> Mark Sheets (SSLC, PUC, Bachelor, Master, PhD, etc.)
                  </label>
                  {uploadStatus.marksCard === "success" && <CheckCircle size={20} color="green" />}
                </div>
                <div style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}
                    >
                      Mark Type
                    </label>
                    <select
                      value={selectedMarksType}
                      onChange={(e) => setSelectedMarksType(e.target.value)}
                      className="form-control"
                    >
                      {MARKS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}
                    >
                      Upload File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "marksCard")}
                      className="form-control"
                      disabled={uploadStatus.marksCard === "uploading"}
                    />
                  </div>
                </div>
                {uploadStatus.marksCard === "uploading" && (
                  <p style={{ color: "#1a5490", marginTop: "0.5rem", fontSize: "0.875rem" }}>Uploading...</p>
                )}
                {profile.marksCards && profile.marksCards.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#1a5490" }}>
                      Uploaded Mark Sheets ({profile.marksCards.length}):
                    </p>
                    <ul style={{ marginLeft: "1.5rem" }}>
                      {profile.marksCards.map((mark, idx) => (
                        <li
                          key={idx}
                          style={{
                            marginBottom: "0.75rem",
                            color: "#28a745",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.5rem",
                            background: "#f0f8f4",
                            borderRadius: "0.25rem",
                          }}
                        >
                          <span>
                            ✓ <strong>{mark.type}</strong> - {getFileName(mark.url)}
                          </span>
                          <button
                            onClick={() => removeMarksCard(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#e74c3c",
                              cursor: "pointer",
                              padding: "0",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ padding: "1.5rem", background: "#f9f9f9", borderRadius: "0.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <label style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={20} /> Professional Certificates & Online Courses
                  </label>
                  {uploadStatus.certificate === "success" && <CheckCircle size={20} color="green" />}
                </div>
                <div style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}
                    >
                      Certificate Type
                    </label>
                    <select
                      value={selectedCertType}
                      onChange={(e) => setSelectedCertType(e.target.value)}
                      className="form-control"
                    >
                      {CERTIFICATE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}
                    >
                      Upload File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "certificate")}
                      className="form-control"
                      disabled={uploadStatus.certificate === "uploading"}
                    />
                  </div>
                </div>
                {uploadStatus.certificate === "uploading" && (
                  <p style={{ color: "#1a5490", marginTop: "0.5rem", fontSize: "0.875rem" }}>Uploading...</p>
                )}
                {profile.certificateUrls && profile.certificateUrls.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#1a5490" }}>
                      Uploaded Certificates ({profile.certificateUrls.length}):
                    </p>
                    <ul style={{ marginLeft: "1.5rem" }}>
                      {profile.certificateUrls.map((cert, idx) => (
                        <li key={idx} style={{ marginBottom: "0.5rem", color: "#28a745", fontSize: "0.875rem" }}>
                          ✓ {getFileName(cert)}
                          <button
                            onClick={() => removeCertificate(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#e74c3c",
                              cursor: "pointer",
                              padding: "0",
                              marginLeft: "0.5rem",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education */}
          {activeTab === "education" && (
            <div className="card" style={{ background: "white", borderRadius: "0.5rem" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Education & Qualifications</h2>

              <div style={{ marginBottom: "2.5rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#1a5490" }}>Academic Degrees</h3>
                <div style={{ marginBottom: "1.5rem" }}>
                  {profile.degrees && profile.degrees.length > 0 ? (
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {profile.degrees.map((degree, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            border: "1px solid #e0e0e0",
                            borderRadius: "0.5rem",
                            background: "#fafafa",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1rem",
                              marginBottom: "1rem",
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "0.25rem",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                Degree
                              </label>
                              <input
                                type="text"
                                placeholder="B.A., B.Sc., M.A., M.Sc., B.Ed., M.Ed."
                                value={degree.degree || ""}
                                onChange={(e) => {
                                  const newDegrees = [...(profile.degrees || [])]
                                  newDegrees[idx] = { ...newDegrees[idx], degree: e.target.value }
                                  handleChange("degrees", newDegrees)
                                }}
                                className="form-control"
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "0.25rem",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                Specialization
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., Physics, Mathematics"
                                value={degree.specialization || ""}
                                onChange={(e) => {
                                  const newDegrees = [...(profile.degrees || [])]
                                  newDegrees[idx] = { ...newDegrees[idx], specialization: e.target.value }
                                  handleChange("degrees", newDegrees)
                                }}
                                className="form-control"
                              />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "0.25rem",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                Institution
                              </label>
                              <input
                                type="text"
                                placeholder="University/College Name"
                                value={degree.institution || ""}
                                onChange={(e) => {
                                  const newDegrees = [...(profile.degrees || [])]
                                  newDegrees[idx] = { ...newDegrees[idx], institution: e.target.value }
                                  handleChange("degrees", newDegrees)
                                }}
                                className="form-control"
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "0.25rem",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                Year
                              </label>
                              <input
                                type="number"
                                placeholder="2020"
                                value={degree.year || ""}
                                onChange={(e) => {
                                  const newDegrees = [...(profile.degrees || [])]
                                  newDegrees[idx] = { ...newDegrees[idx], year: Number.parseInt(e.target.value) || "" }
                                  handleChange("degrees", newDegrees)
                                }}
                                className="form-control"
                                min="1950"
                                max={new Date().getFullYear()}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#999", padding: "1rem", background: "#f9f9f9", borderRadius: "0.5rem" }}>
                      No degrees added yet
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      degrees: [...(prev.degrees || []), { degree: "", specialization: "", institution: "", year: "" }],
                    }))
                  }
                >
                  + Add Degree
                </button>
              </div>

              <div style={{ borderTop: "2px solid #e0e0e0", paddingTop: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#1a5490" }}>Professional Certifications</h3>
                <div style={{ marginBottom: "1.5rem" }}>
                  {profile.certificates && profile.certificates.length > 0 ? (
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {profile.certificates.map((certificate, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            border: "1px solid #e0e0e0",
                            borderRadius: "0.5rem",
                            background: "#fafafa",
                          }}
                        >
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "0.25rem",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                Certificate Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., Advanced Teaching Methodology"
                                value={certificate.name || ""}
                                onChange={(e) => {
                                  const newCerts = [...(profile.certificates || [])]
                                  newCerts[idx] = { ...newCerts[idx], name: e.target.value }
                                  handleChange("certificates", newCerts)
                                }}
                                className="form-control"
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "0.25rem",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                Year Obtained
                              </label>
                              <input
                                type="number"
                                placeholder="2023"
                                value={certificate.year || ""}
                                onChange={(e) => {
                                  const newCerts = [...(profile.certificates || [])]
                                  newCerts[idx] = { ...newCerts[idx], year: Number.parseInt(e.target.value) || "" }
                                  handleChange("certificates", newCerts)
                                }}
                                className="form-control"
                                min="1950"
                                max={new Date().getFullYear()}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#999", padding: "1rem", background: "#f9f9f9", borderRadius: "0.5rem" }}>
                      No certificates added yet
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      certificates: [...(prev.certificates || []), { name: "", year: "" }],
                    }))
                  }
                >
                  + Add Certificate
                </button>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === "preferences" && (
            <div className="card" style={{ background: "white", borderRadius: "0.5rem" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Job Preferences</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Expected Salary (Annual)
                  </label>
                  <input
                    type="text"
                    value={profile.expectedSalary || ""}
                    onChange={(e) => handleChange("expectedSalary", e.target.value)}
                    placeholder="e.g., 5L - 7L / 50000 - 70000"
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Job Type</label>
                  <select
                    multiple
                    value={profile.jobType || []}
                    onChange={(e) =>
                      handleChange(
                        "jobType",
                        Array.from(e.target.selectedOptions).map((option) => option.value),
                      )
                    }
                    className="form-control"
                    style={{ padding: "0.5rem", minHeight: "100px" }}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Preferred Locations
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Delhi, Mumbai, Bangalore"
                    value={
                      profile.preferredLocations && profile.preferredLocations.length > 0
                        ? profile.preferredLocations.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      handleChange(
                        "preferredLocations",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Availability</label>
                  <select
                    value={profile.availability || ""}
                    onChange={(e) => handleChange("availability", e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select availability</option>
                    <option value="Immediately">Immediately</option>
                    <option value="15-days">Within 15 days</option>
                    <option value="1-month">Within 1 month</option>
                    <option value="2-months">Within 2 months</option>
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e0e0e0",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={profile.remoteAvailable || false}
                    onChange={(e) => handleChange("remoteAvailable", e.target.checked)}
                  />
                  <span>Available for Remote/Hybrid roles</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={profile.readyToRelocate || false}
                    onChange={(e) => handleChange("readyToRelocate", e.target.checked)}
                  />
                  <span>Ready to relocate</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

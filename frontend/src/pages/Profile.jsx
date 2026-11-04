"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Save, Plus, Trash2, Upload, X, AlertCircle, CheckCircle } from "lucide-react"
import axios from "axios"
import { API_URL } from "../config/api"

export default function Profile() {
  const navigate = useNavigate()
  const token = localStorage.getItem("accessToken")
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [formData, setFormData] = useState({
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    city: "",
    state: "",
    country: "",
    bio: "",
    skills: [],
    availability: "immediately",
    education: [],
    experience: [],
  })

  const [newSkill, setNewSkill] = useState("")
  const [newEducation, setNewEducation] = useState({
    degree: "",
    field: "",
    institution: "",
    graduationYear: "",
    gpa: "",
  })
  const [newExperience, setNewExperience] = useState({
    title: "",
    institution: "",
    startDate: "",
    endDate: "",
    description: "",
  })
  const [files, setFiles] = useState({ resume: null, marksCard: null })
  const [activeTab, setActiveTab] = useState("personal")
  const [uploadStatus, setUploadStatus] = useState("")
  const [apiError, setApiError] = useState("")

  useEffect(() => {
    if (!token) {
      navigate("/login-teacher")
    } else {
      fetchProfile()
    }
  }, [token])

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfileData(response.data)
      setFormData({
        phoneNumber: response.data.phoneNumber || "",
        dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split("T")[0] : "",
        gender: response.data.gender || "",
        city: response.data.city || "",
        state: response.data.state || "",
        country: response.data.country || "",
        bio: response.data.bio || "",
        skills: response.data.skills || [],
        availability: response.data.availability || "immediately",
        education: response.data.education || [],
        experience: response.data.experience || [],
      })
    } catch (error) {
      console.error("[v0] Error fetching profile:", error)
      setApiError("Failed to load profile")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, fileType) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles((prev) => ({ ...prev, [fileType]: file }))
      setUploadStatus(`File selected: ${file.name}`)
    }
  }

  const uploadFile = async (fileType) => {
    if (!files[fileType]) return

    const formDataToSend = new FormData()
    formDataToSend.append(fileType === "resume" ? "resume" : "marksCard", files[fileType])

    try {
      const endpoint = fileType === "resume" ? "/teacher/resume" : "/teacher/marks-card"
      const response = await axios.post(`${API_URL}/profile${endpoint}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      setUploadStatus(`${fileType} uploaded successfully!`)
      setProfileData(response.data.profile)
      setFiles((prev) => ({ ...prev, [fileType]: null }))
      setTimeout(() => setUploadStatus(""), 3000)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadStatus(`Error uploading ${fileType}: ${error.response?.data?.message || error.message}`)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  const addEducation = () => {
    if (newEducation.degree && newEducation.institution) {
      setFormData((prev) => ({
        ...prev,
        education: [...prev.education, newEducation],
      }))
      setNewEducation({ degree: "", field: "", institution: "", graduationYear: "", gpa: "" })
    }
  }

  const removeEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const addExperience = () => {
    if (newExperience.title && newExperience.institution) {
      setFormData((prev) => ({
        ...prev,
        experience: [...prev.experience, newExperience],
      }))
      setNewExperience({ title: "", institution: "", startDate: "", endDate: "", description: "" })
    }
  }

  const removeExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setApiError("")

    try {
      const response = await axios.put(`${API_URL}/profile/teacher`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      setUploadStatus("Profile updated successfully!")
      setProfileData(response.data.profile)
      setTimeout(() => setUploadStatus(""), 3000)
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      setApiError("Failed to update profile: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <nav
        style={{
          background: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "1rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link to="/" style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1a5490", textDecoration: "none" }}>
            TeacherWorld
          </Link>
          <Link
            to="/dashboard/teacher"
            style={{
              padding: "0.5rem 1rem",
              background: "#f0f0f0",
              color: "#333",
              textDecoration: "none",
              borderRadius: "0.375rem",
              fontWeight: "500",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <section style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "2rem", color: "#1a5490" }}>My Profile</h1>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            borderBottom: "2px solid #eee",
            overflowX: "auto",
          }}
        >
          {["personal", "education", "experience", "documents"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "1rem",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "3px solid #1a5490" : "none",
                color: activeTab === tab ? "#1a5490" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === tab ? "600" : "400",
                textTransform: "capitalize",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {apiError && (
          <div
            style={{
              padding: "1rem",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "0.375rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "0.5rem",
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "0.125rem" }} />
            <div>{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <div style={{ background: "white", padding: "2rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#1a5490" }}>Personal Information</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Availability</label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  >
                    <option value="immediately">Immediately</option>
                    <option value="1-month">Within 1 Month</option>
                    <option value="3-months">Within 3 Months</option>
                  </select>
                </div>
              </div>

              <h4 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#1a5490" }}>Location</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter your city"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter your state"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Enter your country"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Bio / About You</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself, teaching experience, interests..."
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "0.375rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <h4 style={{ marginBottom: "1rem", color: "#1a5490" }}>Skills</h4>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g., English, Science, Mathematics)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "0.375rem",
                  }}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#1a5490",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Plus size={18} /> Add
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                {formData.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#e0e7ff",
                      color: "#1a5490",
                      padding: "0.5rem 1rem",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#1a5490",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === "education" && (
            <div style={{ background: "white", padding: "2rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#1a5490" }}>Education</h3>

              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  marginBottom: "2rem",
                }}
              >
                <h4 style={{ marginBottom: "1rem" }}>Add Education</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <input
                    type="text"
                    placeholder="Degree (e.g., B.A., M.A.)"
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Field (e.g., Mathematics)"
                    value={newEducation.field}
                    onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <input
                    type="text"
                    placeholder="Institution"
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Graduation Year"
                    value={newEducation.graduationYear}
                    onChange={(e) => setNewEducation({ ...newEducation, graduationYear: e.target.value })}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="GPA"
                    step="0.01"
                    value={newEducation.gpa}
                    onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addEducation}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#1a5490",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Plus size={18} /> Add Education
                </button>
              </div>

              <div>
                <h4 style={{ marginBottom: "1rem" }}>Your Education</h4>
                {formData.education.length === 0 ? (
                  <p style={{ color: "#999" }}>No education added yet.</p>
                ) : (
                  formData.education.map((edu, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "0.5rem",
                        marginBottom: "1rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h5 style={{ marginBottom: "0.25rem" }}>
                          {edu.degree} in {edu.field}
                        </h5>
                        <p style={{ margin: "0.5rem 0 0", color: "#666" }}>{edu.institution}</p>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#999" }}>
                          Graduated: {edu.graduationYear} | GPA: {edu.gpa}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#e74c3c",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div style={{ background: "white", padding: "2rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#1a5490" }}>Professional Experience</h3>

              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  marginBottom: "2rem",
                }}
              >
                <h4 style={{ marginBottom: "1rem" }}>Add Experience</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Institution / School"
                    value={newExperience.institution}
                    onChange={(e) => setNewExperience({ ...newExperience, institution: e.target.value })}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: "#666" }}>Start Date</label>
                    <input
                      type="date"
                      value={newExperience.startDate}
                      onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ddd",
                        borderRadius: "0.375rem",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.875rem", color: "#666" }}>End Date</label>
                    <input
                      type="date"
                      value={newExperience.endDate}
                      onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ddd",
                        borderRadius: "0.375rem",
                      }}
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Job Description / Responsibilities"
                  value={newExperience.description}
                  onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "0.375rem",
                    fontFamily: "inherit",
                    marginBottom: "1rem",
                  }}
                />
                <button
                  type="button"
                  onClick={addExperience}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#1a5490",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Plus size={18} /> Add Experience
                </button>
              </div>

              <div>
                <h4 style={{ marginBottom: "1rem" }}>Your Experience</h4>
                {formData.experience.length === 0 ? (
                  <p style={{ color: "#999" }}>No experience added yet.</p>
                ) : (
                  formData.experience.map((exp, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "0.5rem",
                        marginBottom: "1rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h5 style={{ marginBottom: "0.25rem" }}>{exp.title}</h5>
                        <p style={{ margin: "0.5rem 0 0", color: "#666" }}>{exp.institution}</p>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#999" }}>
                          {new Date(exp.startDate).toLocaleDateString()} -{" "}
                          {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}
                        </p>
                        <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>{exp.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#e74c3c",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div style={{ background: "white", padding: "2rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#1a5490" }}>Documents & Certificates</h3>

              {uploadStatus && (
                <div
                  style={{
                    padding: "1rem",
                    background: uploadStatus.includes("Error") ? "#fee2e2" : "#dcfce7",
                    color: uploadStatus.includes("Error") ? "#991b1b" : "#166534",
                    borderRadius: "0.375rem",
                    marginBottom: "1.5rem",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  {uploadStatus.includes("Error") ? (
                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "0.125rem" }} />
                  ) : (
                    <CheckCircle size={20} style={{ flexShrink: 0, marginTop: "0.125rem" }} />
                  )}
                  <div>{uploadStatus}</div>
                </div>
              )}

              <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", marginBottom: "1rem", fontWeight: "500" }}>
                  Resume (PDF, DOC, DOCX)
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem",
                    border: "2px dashed #1a5490",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    backgroundColor: "#f0f4ff",
                  }}
                >
                  <input
                    type="file"
                    id="resume-input"
                    onChange={(e) => handleFileChange(e, "resume")}
                    accept=".pdf,.doc,.docx"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="resume-input" style={{ cursor: "pointer", textAlign: "center", width: "100%" }}>
                    <Upload size={32} style={{ marginBottom: "0.5rem", color: "#1a5490", display: "block" }} />
                    <p style={{ margin: "0.5rem 0", fontWeight: "500" }}>
                      {files.resume ? files.resume.name : "Click to upload your resume"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>or drag and drop</p>
                  </label>
                </div>
                {files.resume && (
                  <button
                    type="button"
                    onClick={() => uploadFile("resume")}
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#2ecc71",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Upload Resume
                  </button>
                )}
                {profileData?.resumeUrl && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
                    Current:{" "}
                    <a
                      href={`${API_URL.replace("/api", "")}${profileData.resumeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1a5490", textDecoration: "underline" }}
                    >
                      View Resume
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "1rem", fontWeight: "500" }}>
                  Marks Card / Certificate (Image or PDF)
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem",
                    border: "2px dashed #1a5490",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    backgroundColor: "#f0f4ff",
                  }}
                >
                  <input
                    type="file"
                    id="marks-input"
                    onChange={(e) => handleFileChange(e, "marksCard")}
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="marks-input" style={{ cursor: "pointer", textAlign: "center", width: "100%" }}>
                    <Upload size={32} style={{ marginBottom: "0.5rem", color: "#1a5490", display: "block" }} />
                    <p style={{ margin: "0.5rem 0", fontWeight: "500" }}>
                      {files.marksCard ? files.marksCard.name : "Upload your marks card or certificate"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>or drag and drop</p>
                  </label>
                </div>
                {files.marksCard && (
                  <button
                    type="button"
                    onClick={() => uploadFile("marksCard")}
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#2ecc71",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Upload Marks Card
                  </button>
                )}
                {profileData?.marksCardUrl && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
                    Current:{" "}
                    <a
                      href={`${API_URL.replace("/api", "")}${profileData.marksCardUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1a5490", textDecoration: "underline" }}
                    >
                      View Document
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
            <Link
              to="/dashboard/teacher"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "0.375rem",
                cursor: "pointer",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: loading ? "#ccc" : "#1a5490",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

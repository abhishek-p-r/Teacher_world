"use client"

import { useState } from "react"
import { X, Upload, Plus } from "lucide-react"
import axios from "axios"

import { API_URL } from "../config/api"

export default function ProfileCompletionModal({ isOpen, onClose, userId, token, onProfileUpdate }) {
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

  const [files, setFiles] = useState({
    resume: null,
    marksCard: null,
    certificates: [],
  })

  const [newSkill, setNewSkill] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, fileType) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles((prev) => ({ ...prev, [fileType]: file }))
    }
  }

  const addSkill = () => {
    if (newSkill.trim()) {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()

      // Append text fields
      Object.keys(formData).forEach((key) => {
        if (key !== "certificates") {
          if (typeof formData[key] === "object") {
            formDataToSend.append(key, JSON.stringify(formData[key]))
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      // Append files
      if (files.resume) formDataToSend.append("resume", files.resume)
      if (files.marksCard) formDataToSend.append("marksCard", files.marksCard)
      files.certificates.forEach((cert) => {
        formDataToSend.append("certificates", cert)
      })

      const response = await axios.put(`${API_URL}/profile/teacher`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      alert("Profile updated successfully!")
      onProfileUpdate(response.data.profile)
      onClose()
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      alert("Failed to update profile: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2>Complete Your Profile</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#1a5490" }}>Personal Information</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "0.375rem",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
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
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                placeholder="Tell us about yourself, your teaching style, and interests..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "0.375rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#1a5490" }}>Location</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
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
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
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

          {/* Skills */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#1a5490" }}>Skills</h3>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
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
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    style={{ background: "none", border: "none", color: "#1a5490", cursor: "pointer" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#1a5490" }}>Documents</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Resume (PDF, DOC, DOCX)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem",
                  border: "2px dashed #1a5490",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  backgroundColor: "#f0f4ff",
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "resume")}
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                />
                <div style={{ textAlign: "center" }}>
                  <Upload size={24} style={{ marginBottom: "0.5rem", color: "#1a5490" }} />
                  <p style={{ margin: 0 }}>{files.resume ? files.resume.name : "Click to upload your resume"}</p>
                </div>
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Marks Card (Image or PDF)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem",
                  border: "2px dashed #1a5490",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  backgroundColor: "#f0f4ff",
                }}
              >
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "marksCard")}
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                />
                <div style={{ textAlign: "center" }}>
                  <Upload size={24} style={{ marginBottom: "0.5rem", color: "#1a5490" }} />
                  <p style={{ margin: 0 }}>{files.marksCard ? files.marksCard.name : "Upload your marks card"}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Availability */}
          <div style={{ marginBottom: "2rem" }}>
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

          {/* Submit Button */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.75rem",
                backgroundColor: loading ? "#ccc" : "#1a5490",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

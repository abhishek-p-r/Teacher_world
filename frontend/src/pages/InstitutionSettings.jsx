"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Lock, Edit2 } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"

import { API_URL } from "../config/api"

export default function InstitutionSettings() {
  const [settings, setSettings] = useState({
    institutionName: "ABC School",
    website: "www.abcschool.com",
    phone: "+91-9876543210",
    emailNotifications: true,
    jobPostingNotifications: true,
    applicationNotifications: true,
  })
  const [activeTab, setActiveTab] = useState("general")
  const [token] = useState(localStorage.getItem("accessToken"))
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/institution`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSettings(response.data)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API_URL}/settings/institution`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      })
      alert("Settings updated successfully!")
      setEditMode(false)
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <Link to="/dashboard/institution" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

  <section style={{ padding: "2rem 0", background: "var(--gray-50)", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <h1 style={{ marginBottom: "2rem" }}>Institution Settings</h1>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #e0e0e0" }}>
            <button
              onClick={() => setActiveTab("general")}
              style={{
                padding: "1rem",
                background: activeTab === "general" ? "#1a5490" : "transparent",
                color: activeTab === "general" ? "white" : "#666",
                border: "none",
                cursor: "pointer",
                borderRadius: "0.5rem",
              }}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              style={{
                padding: "1rem",
                background: activeTab === "notifications" ? "#1a5490" : "transparent",
                color: activeTab === "notifications" ? "white" : "#666",
                border: "none",
                cursor: "pointer",
                borderRadius: "0.5rem",
              }}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("security")}
              style={{
                padding: "1rem",
                background: activeTab === "security" ? "#1a5490" : "transparent",
                color: activeTab === "security" ? "white" : "#666",
                border: "none",
                cursor: "pointer",
                borderRadius: "0.5rem",
              }}
            >
              Security
            </button>
          </div>

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2>Institution Information</h2>
                <button onClick={() => setEditMode(!editMode)} className="btn btn-secondary btn-sm">
                  <Edit2 size={16} /> {editMode ? "Cancel" : "Edit"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Institution Name
                  </label>
                  <input
                    type="text"
                    value={settings.institutionName}
                    onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                    className="form-control"
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Website</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="form-control"
                    disabled={!editMode}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Contact Phone</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="form-control"
                    disabled={!editMode}
                  />
                </div>
              </div>
              {editMode && (
                <button onClick={handleSaveSettings} className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
                  Save Changes
                </button>
              )}
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="card">
              <h2 style={{ marginBottom: "1.5rem" }}>Notification Preferences</h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 0",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>Email Notifications</h4>
                    <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>
                      Receive important updates via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    style={{ width: "50px", height: "24px", cursor: "pointer" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 0",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>Job Posting Notifications</h4>
                    <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>Get notified when jobs are posted</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.jobPostingNotifications}
                    onChange={(e) => setSettings({ ...settings, jobPostingNotifications: e.target.checked })}
                    style={{ width: "50px", height: "24px", cursor: "pointer" }}
                  />
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0" }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>Application Notifications</h4>
                    <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>Get notified for new applications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.applicationNotifications}
                    onChange={(e) => setSettings({ ...settings, applicationNotifications: e.target.checked })}
                    style={{ width: "50px", height: "24px", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="card">
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <Lock size={24} /> Security
              </h2>
              <div>
                <h4 style={{ marginBottom: "1rem" }}>Change Password</h4>
                <p style={{ color: "#666", marginBottom: "1rem" }}>
                  Update your password regularly to keep your account secure
                </p>
                <button className="btn btn-primary">
                  <Lock size={16} /> Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

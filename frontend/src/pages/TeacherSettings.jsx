"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Lock, Trash2 } from "lucide-react"
import axios from "axios"
import { logout } from "../lib/auth"
import Logo from "../components/Logo"
import { API_URL } from "../config/api"

export default function TeacherSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    jobAlerts: true,
    interviewReminders: true,
    profileVisibility: "public",
    allowMessages: true,
  })
  const [activeTab, setActiveTab] = useState("general")
  const [token] = useState(localStorage.getItem("accessToken"))
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSettings(response.data)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const handleToggle = async (setting) => {
    const newSettings = { ...settings, [setting]: !settings[setting] }
    setSettings(newSettings)
    try {
      await axios.put(`${API_URL}/settings/teacher`, newSettings, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (error) {
      console.error("Failed to update settings:", error)
    }
  }

  const handleChangePassword = () => {
    alert("Password change feature coming soon")
  }

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`${API_URL}/account/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      logout(navigate)
    } catch (error) {
      console.error("Failed to delete account:", error)
    }
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand">
            <Logo />
          </Link>
          <Link to="/dashboard/teacher" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

  <section style={{ padding: "2rem 0", background: "var(--gray-50)", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <h1 style={{ marginBottom: "2rem" }}>Account Settings</h1>

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
              onClick={() => setActiveTab("privacy")}
              style={{
                padding: "1rem",
                background: activeTab === "privacy" ? "#1a5490" : "transparent",
                color: activeTab === "privacy" ? "white" : "#666",
                border: "none",
                cursor: "pointer",
                borderRadius: "0.5rem",
              }}
            >
              Privacy
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
                      Receive job alerts and updates via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle("emailNotifications")}
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
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>Job Alerts</h4>
                    <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>
                      Get alerts for matching job opportunities
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.jobAlerts}
                    onChange={() => handleToggle("jobAlerts")}
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
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>Interview Reminders</h4>
                    <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>
                      Get reminders for scheduled interviews
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.interviewReminders}
                    onChange={() => handleToggle("interviewReminders")}
                    style={{ width: "50px", height: "24px", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === "privacy" && (
            <div className="card">
              <h2 style={{ marginBottom: "1.5rem" }}>Privacy Settings</h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <h4>Profile Visibility</h4>
                  <select
                    value={settings.profileVisibility}
                    onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
                    className="form-control"
                  >
                    <option value="public">Public - Visible to all institutions</option>
                    <option value="private">Private - Only to matched institutions</option>
                    <option value="hidden">Hidden - Not searchable</option>
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 0",
                    borderTop: "1px solid #e0e0e0",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>Allow Messages</h4>
                    <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>
                      Allow institutions to send you messages
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowMessages}
                    onChange={() => handleToggle("allowMessages")}
                    style={{ width: "50px", height: "24px", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="card">
              <h2 style={{ marginBottom: "1.5rem" }}>Security</h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Lock size={20} /> Change Password
                  </h3>
                  <p style={{ color: "#666", marginBottom: "1rem" }}>
                    Update your password regularly to keep your account secure
                  </p>
                  <button onClick={handleChangePassword} className="btn btn-primary">
                    Change Password
                  </button>
                </div>
                <hr />
                <div>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#e74c3c" }}>
                    <Trash2 size={20} /> Danger Zone
                  </h3>
                  <p style={{ color: "#666", marginBottom: "1rem" }}>
                    This action cannot be undone. Please be sure before deleting your account.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      background: "#e74c3c",
                      color: "white",
                      padding: "0.75rem 1.5rem",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div className="card" style={{ maxWidth: "400px" }}>
                <h2 style={{ color: "#e74c3c", marginBottom: "1rem" }}>Delete Account?</h2>
                <p style={{ color: "#666", marginBottom: "1.5rem" }}>
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={handleDeleteAccount}
                    className="btn"
                    style={{ flex: 1, background: "#e74c3c", color: "white" }}
                  >
                    Delete
                  </button>
                  <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

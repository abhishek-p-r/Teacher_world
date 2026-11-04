"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Bell, Trash2 } from "lucide-react"
import axios from "axios"
import Logo from "../components/Logo"
import { API_URL } from "../config/api"

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "job-alert",
      title: "New Math Teacher Job Posted",
      message: "ABC School posted a Math teacher position",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "interview",
      title: "Interview Scheduled",
      message: "Your interview with XYZ Institute is scheduled for tomorrow",
      time: "5 hours ago",
      read: false,
    },
    {
      id: 3,
      type: "application",
      title: "Application Shortlisted",
      message: "Your application for Physics Teacher role has been shortlisted",
      time: "1 day ago",
      read: true,
    },
    {
      id: 4,
      type: "chat",
      title: "New Message from ABC School",
      message: "HR team sent you a message regarding your application",
      time: "2 days ago",
      read: true,
    },
    {
      id: 5,
      type: "expiry",
      title: "Profile Expiry Alert",
      message: "Your job applications expire in 3 days",
      time: "3 days ago",
      read: true,
    },
  ])
  const [token] = useState(localStorage.getItem("accessToken"))

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(response.data)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type) => {
    const icons = {
      "job-alert": "🔔",
      interview: "📅",
      application: "✅",
      chat: "💬",
      expiry: "⚠️",
    }
    return icons[type] || "📢"
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
        <div className="container" style={{ maxWidth: "700px" }}>
          <h1 style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <Bell size={32} /> Notifications
          </h1>

          <div style={{ display: "grid", gap: "1rem" }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${notif.read ? "#e0e0e0" : "#1a5490"}`,
                  background: notif.read ? "#fafafa" : "white",
                }}
              >
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ fontSize: "1.5rem" }}>{getNotificationIcon(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: "0.25rem" }}>{notif.title}</h4>
                    <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{notif.message}</p>
                    <p style={{ color: "#999", fontSize: "0.75rem" }}>{notif.time}</p>
                  </div>
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#999" }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="card text-center">
              <Bell size={48} style={{ color: "#e0e0e0", margin: "0 auto 1rem" }} />
              <p style={{ color: "#999" }}>No notifications</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

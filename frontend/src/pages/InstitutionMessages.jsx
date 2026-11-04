"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Send, ArrowLeft, Trash2 } from "lucide-react"
import axios from "axios"
import { io } from "socket.io-client"
import Logo from "../components/Logo"

import { API_URL, BASE_URL } from "../config/api"

export default function InstitutionMessages() {
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [senderNames, setSenderNames] = useState({})
  const messagesEndRef = useRef(null)
  const token = localStorage.getItem("accessToken")
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
  const currentUserId = currentUser.userId

  useEffect(() => {
    fetchConversations()
    initializeSocket()
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
    }
  }, [messages])

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConversations(response.data || [])
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = async (applicationId) => {
    setSelectedConv(applicationId)
    try {
      const response = await axios.get(`${API_URL}/messages/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const initializeSocket = () => {
    const newSocket = io(BASE_URL, {
      auth: {
        token: token,
      },
    })

    newSocket.on("connect", () => {
      console.log("Connected to socket")
      setIsConnected(true)
      newSocket.emit("join", currentUserId)
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket")
      setIsConnected(false)
    })

    newSocket.on("new_message", (message) => {
      setMessages((prev) => [...prev, message])
    })

    newSocket.on("user_typing", (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => new Set([...prev, data.senderId]))
      } else {
        setTypingUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.senderId)
          return newSet
        })
      }
    })

    setSocket(newSocket)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return

    try {
      // Find the conversation to get the receiverId
      const conversation = conversations.find(conv => conv.applicationId === selectedConv)
      if (!conversation || !conversation.receiverId) {
        alert("Unable to find receiver for this conversation")
        return
      }

      const messageData = {
        senderId: currentUserId,
        receiverId: conversation.receiverId,
        content: newMessage.trim(),
        applicationId: selectedConv,
      }

      // Send via socket for real-time
      if (socket && isConnected) {
        socket.emit("private_message", messageData)
      }

      // Also send via API as fallback
      const response = await axios.post(
        `${API_URL}/messages`,
        messageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      setMessages([...messages, response.data])
      setNewMessage("")
      fetchConversations() // Refresh conversations to update latest message and unread count
    } catch (error) {
      console.error("Failed to send message:", error)
      alert(`Failed to send message: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleTyping = () => {
    if (selectedConv && socket && isConnected) {
      const conversation = conversations.find(conv => conv.applicationId === selectedConv)
      if (conversation && conversation.receiverId) {
        socket.emit("typing", {
          receiverId: conversation.receiverId,
          isTyping: newMessage.length > 0,
        })
      }
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return

    try {
      await axios.delete(`${API_URL}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
      fetchConversations() // Refresh conversations to update latest message
    } catch (error) {
      console.error("Failed to delete message:", error)
      alert(`Failed to delete message: ${error.response?.data?.message || error.message}`)
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column" }}>
      <nav className="navbar">
        <div className="container flex justify-between">
          <Link to="/" className="navbar-brand">
            <Logo />
          </Link>
          <Link to="/dashboard/institution" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </nav>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Conversations List */}
        <div
          style={{
            width: "300px",
            background: "var(--gray-50)",
            borderRight: "1px solid #e0e0e0",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "1rem" }}>
            <input
              type="text"
              placeholder="Search conversations..."
              className="form-control"
              style={{ marginBottom: "1rem" }}
            />

            {loading ? (
              <p style={{ color: "#999" }}>Loading...</p>
            ) : conversations.length === 0 ? (
              <p style={{ color: "#999" }}>No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.applicationId}
                  onClick={() => handleSelectConversation(conv.applicationId)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: selectedConv === conv.applicationId ? "#1a5490" : "transparent",
                    color: selectedConv === conv.applicationId ? "white" : "#333",
                    border: "none",
                    borderRadius: "0.5rem",
                    textAlign: "left",
                    cursor: "pointer",
                    marginBottom: "0.5rem",
                    transition: "all 0.3s",
                  }}
                >
                  <p style={{ margin: "0 0 0.25rem", fontWeight: "600" }}>
                    {conv.teacherName} - {conv.jobTitle}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.8 }}>
                    {(conv.latestMessage || "No messages yet").substring(0, 30)}...
                  </p>
                   {conv.unreadCount > 0 && (
                     <span style={{
                       background: "#ff4444",
                       color: "white",
                       borderRadius: "50%",
                       padding: "0.2rem 0.5rem",
                       fontSize: "0.75rem",
                       marginLeft: "0.5rem"
                     }}>
                       {conv.unreadCount || 0}
                     </span>
                   )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e0e0e0",
                  background: "#f5f5f5",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  {conversations.find((c) => c.applicationId === selectedConv)?.teacherName || "Chat"}
                </h3>
              </div>

              {/* Application Context */}
              {selectedConv && (
                <div
                  style={{
                    padding: "1rem",
                    background: "#f8f9fa",
                    borderBottom: "1px solid #e0e0e0",
                    fontSize: "0.9rem",
                  }}
                >
                  {(() => {
                    const conv = conversations.find((c) => c.applicationId === selectedConv)
                    if (!conv) return null

                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: "bold", color: "#1a5490" }}>👨‍🏫 Teacher Application:</span>
                        <span>
                          {conv.teacherName} for {conv.jobTitle}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Messages */}
              <div
                ref={messagesEndRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {(() => {
                  const selectedConversation = conversations.find(c => c.applicationId === selectedConv)
                  return messages.map((msg, idx) => {
                    const senderType = msg.senderType || (msg.senderId._id === currentUserId ? "institution" : "teacher")
                    const senderName = senderType === "institution" ? msg.institutionName || selectedConversation?.institutionName || "Institution" : msg.teacherName || selectedConversation?.teacherName || "Teacher"
                    const isLeft = senderType === "teacher"

                    return (
                      <div
                        key={msg._id || idx}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isLeft ? "flex-start" : "flex-end",
                          gap: "0.25rem",
                          marginBottom: "1rem",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "60%",
                            background: isLeft ? "#e0e0e0" : "#1a5490",
                            color: isLeft ? "#333" : "white",
                            padding: "0.75rem 1rem",
                            borderRadius: "0.5rem",
                            wordWrap: "break-word",
                            position: "relative",
                          }}
                        >
                          {msg.content}
                          {senderType === "institution" && (
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              style={{
                                position: "absolute",
                                top: "-5px",
                                right: "-5px",
                                background: "#ff4444",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                              }}
                              title="Delete message"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#666",
                            fontWeight: "500",
                            textAlign: isLeft ? "left" : "right",
                          }}
                        >
                          {senderName}
                        </div>
                      </div>
                    )
                  })
                })()}
                {typingUsers.size > 0 && (
                  <div style={{ fontStyle: "italic", color: "#999", fontSize: "0.875rem" }}>
                    Someone is typing...
                  </div>
                )}
              </div>

              {/* Input */}
              <div
                style={{
                  padding: "1rem",
                  borderTop: "1px solid #e0e0e0",
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="form-control"
                />
                <button
                  onClick={handleSendMessage}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#999",
              }}
            >
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

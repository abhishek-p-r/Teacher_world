import React from "react"

"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, MessageCircle, Minimize2, Maximize2 } from "lucide-react"

// Function to format bot messages with proper HTML rendering
function formatBotMessage(text) {
  if (!text) return ""

  // Split by lines and process each line
  const lines = text.split('\n').filter(line => line.trim())

  // Check if this looks like a list (starts with bullets or numbers)
  const hasBullets = lines.some(line => line.trim().match(/^[-•*]\s/))
  const hasNumbers = lines.some(line => line.trim().match(/^\d+\.\s/))

  if (hasBullets || hasNumbers) {
    // Format as HTML list
    const listItems = lines.map(line => {
      const trimmed = line.trim()
      if (hasNumbers && trimmed.match(/^\d+\.\s/)) {
        return `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`
      } else if (hasBullets && trimmed.match(/^[-•*]\s/)) {
        return `<li>${trimmed.replace(/^[-•*]\s/, '')}</li>`
      }
      return `<li>${trimmed}</li>`
    })

    return `<ul style="margin: 0; padding-left: 1.2em;">${listItems.join('')}</ul>`
  } else {
    // Format as paragraphs with line breaks
    return lines.map(line => `<p style="margin: 0.5em 0;">${line.trim()}</p>`).join('')
  }
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

async function sendMessage(messageText) {
  try {
    const cleanBase = API_URL.replace(/\/api\/?$/i, "")
    const response = await fetch(`${cleanBase}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    })

    if (!response.ok) {
      const data = await response.json()
      const errorMsg = data.error || data.message || `Server error: ${response.statusText}`
      throw new Error(errorMsg)
    }

    const data = await response.json()
    // Refine fallback response handling
    if (data.response === undefined || data.response === null || data.response.trim() === "") {
      return "This question is not related to teachers or institutions. Please ask something about the TeacherWorld Portal."
    }
    return data.response || "Something went wrong. Please try again."
  } catch (error) {
    // Return fallback on error
    return "Something went wrong. Please try again."
  }
}
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi! I'm TeacherWorld Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setError(null)

    try {
      const botText = await sendMessage(userMessage.text)

      const botMessage = {
        id: messages.length + 2,
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
      const errorMessage = {
        id: messages.length + 2,
        text: err.message || "Something went wrong. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1a5490 0%, #0f3a63 100%)",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 5px 20px rgba(26, 84, 144, 0.3)",
            zIndex: 998,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)"
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(26, 84, 144, 0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)"
            e.currentTarget.style.boxShadow = "0 5px 20px rgba(26, 84, 144, 0.3)"
          }}
          title="Chat with TeacherWorld Assistant"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            width: "380px",
            maxWidth: "calc(100vw - 2rem)",
            height: isMinimized ? "auto" : "500px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            transition: "all 0.3s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a5490 0%, #0f3a63 100%)",
              color: "white",
              padding: "1rem",
              borderRadius: "12px 12px 0 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: "0", fontSize: "1rem", fontWeight: "600" }}>TeacherWorld Assistant</h3>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", opacity: 0.9 }}>💬 Always here to help</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                }}
                title={isMinimized ? "Restore" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  background: "#f9fafb",
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        background: msg.sender === "user" ? "#1a5490" : "#e5e7eb",
                        color: msg.sender === "user" ? "white" : "#333",
                        fontSize: "0.9rem",
                        lineHeight: "1.4",
                        wordWrap: "break-word",
                      }}
                    >
                      {msg.sender === "bot" ? (
                        <div dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#1a5490",
                        animation: "bounce 1.4s infinite",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#1a5490",
                        animation: "bounce 1.4s infinite 0.2s",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#1a5490",
                        animation: "bounce 1.4s infinite 0.4s",
                      }}
                    />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "1rem", borderTop: "1px solid #e5e7eb", background: "white" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask me anything..."
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    aria-label="Send Message"
                    style={{
                      background: "#1a5490",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.625rem 1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      opacity: !inputValue.trim() || isLoading ? 0.6 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.5;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }
      `}</style>
    </>
  )
}

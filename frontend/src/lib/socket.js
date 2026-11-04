import io from 'socket.io-client'

const rawApiUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:5000"
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/i, "")

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.messageListeners = []
    this.typingListeners = []
  }

  connect(userId) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(API_BASE_URL, {
      auth: {
        token: localStorage.getItem('accessToken') || localStorage.getItem('token')
      }
    })

    this.socket.on('connect', () => {
      console.log('[SOCKET] Connected to server')
      this.isConnected = true

      // Join user room
      if (userId) {
        this.socket.emit('join', userId)
      }
    })

    this.socket.on('disconnect', () => {
      console.log('[SOCKET] Disconnected from server')
      this.isConnected = false
    })

    // Handle incoming messages
    this.socket.on('new_message', (message) => {
      this.messageListeners.forEach(listener => listener(message))
    })

    // Handle typing indicators
    this.socket.on('user_typing', (data) => {
      this.typingListeners.forEach(listener => listener(data))
    })

    // Handle message errors
    this.socket.on('message_error', (error) => {
      console.error('[SOCKET] Message error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Send a private message
  sendMessage(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('private_message', data)
    } else {
      console.error('[SOCKET] Not connected to server')
    }
  }

  // Send typing indicator
  sendTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', data)
    }
  }

  // Add message listener
  onMessage(callback) {
    this.messageListeners.push(callback)
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback)
    }
  }

  // Add typing listener
  onTyping(callback) {
    this.typingListeners.push(callback)
    return () => {
      this.typingListeners = this.typingListeners.filter(listener => listener !== callback)
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService

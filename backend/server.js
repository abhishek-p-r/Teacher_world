const dotenv = require("dotenv")
// Load env vars and check for errors
const envResult = dotenv.config()
if (envResult.error) {
  console.error("[Server] Error loading .env file:", envResult.error)
}
console.log("[Server] GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? "Yes" : "No")

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const path = require("path")
const fs = require("fs")
const http = require("http")
const socketIo = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
})

// Enhanced logging function to prevent logging failures
function log(level, message, ...args) {
  try {
    const timestamp = new Date().toISOString()
    const levelUpper = level.toUpperCase()
    const prefix = `[${levelUpper}] ${timestamp}`

    switch (level) {
      case 'error':
        console.error(prefix, message, ...args)
        break
      case 'warn':
        console.warn(prefix, message, ...args)
        break
      case 'info':
      default:
        console.log(prefix, message, ...args)
        break
    }
  } catch (error) {
    // Fallback to basic console logging if enhanced logging fails
    console.log(`[${level.toUpperCase()}]`, message, ...args)
  }
}

console.log("[SERVER] Starting server initialization...")
console.log("[SERVER] Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI ? "***configured***" : "NOT SET",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  GMAIL_USER: process.env.GMAIL_USER ? "***configured***" : "NOT SET",
})

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

log("info", "CORS configured for origin:", corsOptions.origin)
app.use(cors(corsOptions))

app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ limit: "100mb", extended: true }))

app.use((req, res, next) => {
  log("info", `API Request: ${req.method} ${req.path}`)
  next()
})

// Upload directories
const uploadDirs = [
  path.join(__dirname, "uploads/resumes"),
  path.join(__dirname, "uploads/certificates"),
  path.join(__dirname, "uploads/materials"),
  path.join(__dirname, "uploads/marksCards"),
  path.join(__dirname, "uploads/photos"),
  path.join(__dirname, "uploads/institution-photos"),
]

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Database Connection with retry (do not exit process in dev)
console.log("[SERVER] Attempting MongoDB connection...")
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/teacher-portal"
const connectWithRetry = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("[SERVER] MongoDB connected successfully")
  } catch (err) {
    console.error("[SERVER] MongoDB connection FAILED:", err.message)
    console.log("[SERVER] Will retry MongoDB connection in 5 seconds...")
    setTimeout(connectWithRetry, 5000)
  }
}

connectWithRetry()

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"))
app.use("/api/auth", require("./src/routes/socialAuthRoutes"))
app.use("/api/jobs", require("./src/routes/jobRoutes"))
app.use("/api/applications", require("./src/routes/applicationRoutes"))
app.use("/api/messages", require("./src/routes/messageRoutes"))
app.use("/api/interviews", require("./src/routes/interviewRoutes"))
app.use("/api/profile", require("./src/routes/profileRoutes"))
app.use("/api/materials", require("./src/routes/materialRoutes"))
app.use("/api/zoom", require("./src/routes/zoomRoutes"))
app.use("/api/location", require("./src/routes/locationRoutes"))
app.use("/api/chat", require("./src/routes/chatRoutes"))

app.use("/api/institution/teams", require("./src/routes/institutionTeamRoutes"))


// Health check
app.get("/api/health", (req, res) => {
  log("info", "Health check request")
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  log("error", "Server error:", err)

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    // Check if this is an application submission based on the URL
    if (req.originalUrl && req.originalUrl.includes("applications")) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job.",
      })
    }
    return res.status(400).json({
      success: false,
      message: "Duplicate entry found. This record already exists.",
    })
  }

  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" })
})

const PORT = parseInt(process.env.PORT, 10) || 5000
let currentPort = PORT

// Start server with port fallback when EADDRINUSE occurs
const tryListen = () => {
  server.listen(currentPort, () => {
    log("info", `Server running on http://localhost:${currentPort}`)
    log("info", "Press Ctrl+C to stop")
  })
}

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    log("warn", `Port ${currentPort} in use, trying ${currentPort + 1}...`)
    currentPort += 1
    // small delay to avoid tight loop
    setTimeout(tryListen, 500)
  } else {
    log("error", 'Server error', err)
  }
})

tryListen()

// Make io accessible from other modules
global.io = io

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("[SOCKET] User connected:", socket.id)

  // Join user-specific room
  socket.on("join", (userId) => {
    socket.join(userId)
    console.log(`[SOCKET] User ${userId} joined room`)
  })

  // Handle private messages
  socket.on("private_message", async (data) => {
    try {
      const { senderId, receiverId, content, applicationId } = data

      // Save message to database
      const Message = require("./src/models/Message")
      const message = new Message({
        senderId,
        receiverId,
        content,
        applicationId,
      })
      await message.save()

      // Emit to receiver
      io.to(receiverId).emit("new_message", {
        ...message.toObject(),
        senderId,
        receiverId,
      })

      // Emit back to sender for confirmation
      socket.emit("message_sent", message.toObject())
    } catch (error) {
      log("error", "Socket error sending message:", error)
      socket.emit("message_error", { error: "Failed to send message" })
    }
  })

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { receiverId, isTyping } = data
    socket.to(receiverId).emit("user_typing", { senderId: socket.id, isTyping })
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    log("info", "Socket user disconnected:", socket.id)
  })
})

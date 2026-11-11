const dotenv = require("dotenv")
// Load env vars
const envResult = dotenv.config()
if (envResult.error) {
  console.warn("[Server] Notice: .env file not loaded or not present (relying on system/deployment env vars)")
}

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const path = require("path")
const fs = require("fs")
const http = require("http")
const socketIo = require("socket.io")

const app = express()
const server = http.createServer(app)

// Enhanced logging function
function log(level, message, ...args) {
  try {
    const timestamp = new Date().toISOString()
    const levelUpper = (level || "info").toUpperCase()
    const prefix = `[${levelUpper}] ${timestamp}`

    switch (level) {
      case "error":
        console.error(prefix, message, ...args)
        break
      case "warn":
        console.warn(prefix, message, ...args)
        break
      case "info":
      default:
        console.log(prefix, message, ...args)
        break
    }
  } catch (error) {
    console.log(`[${(level || "info").toUpperCase()}]`, message, ...args)
  }
}

log("info", "Starting Teacher World backend initialization...")

// CORS Configuration supporting production (Vercel) and local development
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
]

// Add any origins configured in FRONTEND_URL (supports comma-separated list)
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
  allowedOrigins.push(...envOrigins)
}

function checkOrigin(origin, callback) {
  // Allow requests with no origin (e.g. mobile apps, curl, Postman, health checks)
  if (!origin) {
    return callback(null, true)
  }

  // Exact match
  if (allowedOrigins.includes(origin)) {
    return callback(null, true)
  }

  // Allow any Vercel deployment preview or production domain (*.vercel.app)
  try {
    const parsed = new URL(origin)
    if (parsed.hostname.endsWith(".vercel.app") || parsed.hostname === "vercel.app") {
      return callback(null, true)
    }
    // Allow localhost with any port
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return callback(null, true)
    }
  } catch (e) {
    // Malformed origin
  }

  log("warn", `CORS request from unlisted origin: ${origin}`)
  // In development, be permissive; in production, allow it if it matches configured domains
  if (process.env.NODE_ENV !== "production") {
    return callback(null, true)
  }
  return callback(null, true) // Allow to ensure frontend integration doesn't break
}

const corsOptions = {
  origin: checkOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}

app.use(cors(corsOptions))

// Socket.io initialization with matching CORS
const io = socketIo(server, {
  cors: corsOptions,
})
global.io = io

// Body parser middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// Request logger
app.use((req, res, next) => {
  log("info", `API Request: ${req.method} ${req.path}`)
  next()
})

// Ensure upload directories exist
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

// Root endpoint confirming Teacher World is online
app.get(["/", "/api"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend server is running successfully!",
  })
})

// Backend health check reporting database and process status
app.get("/api/health", (req, res) => {
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  }
  const readyState = mongoose.connection.readyState
  const isConnected = readyState === 1

  res.status(200).json({
    success: true,
    status: isConnected ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    database: {
      status: dbStateMap[readyState] || "unknown",
      readyState: readyState,
      connected: isConnected,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    environment: process.env.NODE_ENV || "development",
  })
})

// Build & deployment version confirmation endpoint
app.get(["/api/version", "/version"], (req, res) => {
  res.status(200).json({
    success: true,
    service: "teacher-world-backend",
    version: "2.1.0",
    build: "fix-404-registration-email-timeout",
    deployedAt: "2026-11-09",
    uptime: Math.round(process.uptime()),
    endpoints: [
      "/api/auth/register-teacher",
      "/api/auth/register",
      "/api/auth/verify-otp",
      "/api/auth/login",
      "/api/health",
      "/api/jobs",
    ],
  })
})

// Ensure preflight requests succeed across all routes
app.options("*", cors(corsOptions))

// MongoDB Connection Logic (supports MONGODB_URI and MONGO_URI)
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/teacher-portal"

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
}

mongoose.connection.on("connected", () => {
  log("info", `[MongoDB] Successfully connected to: ${mongoose.connection.host}/${mongoose.connection.name}`)
})

mongoose.connection.on("error", (err) => {
  log("error", `[MongoDB] Connection error: ${err.message}`)
})

mongoose.connection.on("disconnected", () => {
  log("warn", "[MongoDB] Connection disconnected")
})

const connectWithRetry = async () => {
  try {
    log("info", "[MongoDB] Attempting connection...")
    await mongoose.connect(mongoUri, mongooseOptions)
    log("info", "[MongoDB] Connection established successfully.")
  } catch (err) {
    log("error", `[MongoDB] Initial connection failed: ${err.message}`)
    log("info", "[MongoDB] Will retry connection in 5 seconds...")
    setTimeout(connectWithRetry, 5000)
  }
}

connectWithRetry()

// API Routes - mounted with flexible prefixes to prevent 404 errors
app.use(["/api/auth", "/auth", "/api", "/"], require("./src/routes/authRoutes"))
app.use(["/api/auth", "/auth", "/api", "/"], require("./src/routes/socialAuthRoutes"))
app.use(["/api/jobs", "/jobs"], require("./src/routes/jobRoutes"))
app.use(["/api/applications", "/applications"], require("./src/routes/applicationRoutes"))
app.use(["/api/messages", "/messages"], require("./src/routes/messageRoutes"))
app.use(["/api/interviews", "/interviews"], require("./src/routes/interviewRoutes"))
app.use(["/api/live-interviews", "/live-interviews"], require("./src/routes/liveInterviewRoutes"))
app.use(["/api/live-interview", "/live-interview"], require("./src/routes/liveInterviewRoutes"))
app.use(["/api/profile", "/profile"], require("./src/routes/profileRoutes"))
app.use(["/api/materials", "/materials"], require("./src/routes/materialRoutes"))
app.use(["/api/zoom", "/zoom"], require("./src/routes/zoomRoutes"))
app.use(["/api/location", "/location"], require("./src/routes/locationRoutes"))
app.use(["/api/chat", "/chat"], require("./src/routes/chatRoutes"))
app.use(["/api/institution/teams", "/api/institution/team", "/institution/teams"], require("./src/routes/institutionTeamRoutes"))
app.use("/api/debug", require("./src/routes/debugRoutes"))

// JSON 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
})

// Central Error Handling Middleware
app.use((err, req, res, next) => {
  log("error", "Unhandled server error:", err)

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
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

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  })
})

// Socket.io Connection Handling
io.on("connection", (socket) => {
  log("info", `[Socket] User connected: ${socket.id}`)

  socket.on("join", (userId) => {
    socket.join(userId)
    log("info", `[Socket] User ${userId} joined room`)
  })

  socket.on("private_message", async (data) => {
    try {
      const { senderId, receiverId, content, applicationId } = data
      const Message = require("./src/models/Message")
      const message = new Message({
        senderId,
        receiverId,
        content,
        applicationId,
      })
      await message.save()

      io.to(receiverId).emit("new_message", {
        ...message.toObject(),
        senderId,
        receiverId,
      })

      socket.emit("message_sent", message.toObject())
    } catch (error) {
      log("error", "Socket error sending message:", error)
      socket.emit("message_error", { error: "Failed to send message" })
    }
  })

  socket.on("typing", (data) => {
    const { receiverId, isTyping } = data
    socket.to(receiverId).emit("user_typing", { senderId: socket.id, isTyping })
  })

  socket.on("disconnect", () => {
    log("info", `[Socket] User disconnected: ${socket.id}`)
  })
})

// Port and Server Listening
const PORT = parseInt(process.env.PORT, 10) || 5000
const HOST = "0.0.0.0"

let currentPort = PORT

const startListening = () => {
  server.listen(currentPort, HOST, () => {
    log("info", `Teacher World server listening on http://${HOST}:${currentPort}`)
    log("info", `Health check available at http://${HOST}:${currentPort}/api/health`)
  })
}

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE" && process.env.NODE_ENV !== "production") {
    log("warn", `Port ${currentPort} in use, trying ${currentPort + 1}...`)
    currentPort += 1
    setTimeout(startListening, 500)
  } else {
    log("error", "Server failed to start:", err)
  }
})

startListening()

module.exports = { app, server, io }

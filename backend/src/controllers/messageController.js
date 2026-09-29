const Message = require("../models/Message")
const User = require("../models/User")
const Application = require("../models/Application")

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, applicationId } = req.body
    const senderId = req.user.userId

    // Validate required fields
    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver ID and content are required" })
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" })
    }

    // Check if sender exists
    const sender = await User.findById(senderId)
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" })
    }

    // If applicationId is provided, verify the application exists and user is part of it
    if (applicationId) {
      const application = await Application.findById(applicationId)
      if (!application) {
        return res.status(404).json({ message: "Application not found" })
      }

      // Check if sender or receiver is part of this application
      const senderProfile = await require("../models/TeacherProfile").findOne({ userId: senderId })
      const receiverProfile = await require("../models/TeacherProfile").findOne({ userId: receiverId })

      const isSenderTeacher = senderProfile && application.teacherId.toString() === senderProfile._id.toString()
      const isReceiverTeacher = receiverProfile && application.teacherId.toString() === receiverProfile._id.toString()

      // Check if sender is institution
      const senderInstitutionProfile = await require("../models/InstitutionProfile").findOne({ userId: senderId })
      const isSenderInstitution = senderInstitutionProfile && application.institutionId.toString() === senderInstitutionProfile._id.toString()

      // Check if receiver is institution
      const receiverInstitutionProfile = await require("../models/InstitutionProfile").findOne({ userId: receiverId })
      const isReceiverInstitution = receiverInstitutionProfile && application.institutionId.toString() === receiverInstitutionProfile._id.toString()

      if (!((isSenderTeacher && isReceiverInstitution) || (isSenderInstitution && isReceiverTeacher))) {
        return res.status(403).json({ message: "Unauthorized to send message for this application" })
      }
    }

    const message = new Message({
      senderId,
      receiverId,
      content,
      applicationId,
      messageType: "text",
      isRead: false,
    })

    await message.save()

    // Populate sender and receiver info for response
    await message.populate([
      { path: "senderId", select: "name email" },
      { path: "receiverId", select: "name email" },
    ])

    // Emit real-time message via Socket.io
    const io = require("../../server").io
    if (io) {
      io.to(receiverId.toString()).emit("new_message", message.toObject())
    }

    res.status(201).json(message)
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ message: error.message })
  }
}

exports.getMessages = async (req, res) => {
  try {
    const { applicationId } = req.params
    const userId = req.user.userId

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" })
    }

    // Verify user is part of this application
    const application = await Application.findById(applicationId)
    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    const userProfile = await require("../models/TeacherProfile").findOne({ userId })
    const institutionProfile = await require("../models/InstitutionProfile").findOne({ userId })

    const isTeacher = userProfile && application.teacherId.toString() === userProfile._id.toString()
    const isInstitution = institutionProfile && application.institutionId.toString() === institutionProfile._id.toString()

    if (!isTeacher && !isInstitution) {
      return res.status(403).json({ message: "Unauthorized to view messages for this application" })
    }

    const messages = await Message.find({ applicationId })
      .populate({
        path: "senderId",
        select: "name email",
      })
      .populate({
        path: "receiverId",
        select: "name email",
      })
      .sort({ createdAt: 1 })

    // Add senderType, teacherName, institutionName to each message
    const enhancedMessages = await Promise.all(messages.map(async (msg) => {
      const msgObj = msg.toObject()

      // Get sender profile
      const senderTeacherProfile = await require("../models/TeacherProfile").findOne({ userId: msg.senderId._id })
      const senderInstitutionProfile = await require("../models/InstitutionProfile").findOne({ userId: msg.senderId._id })

      let senderType = "unknown"
      let teacherName = ""
      let institutionName = ""

      if (senderTeacherProfile) {
        senderType = "teacher"
        teacherName = senderTeacherProfile.name
      } else if (senderInstitutionProfile) {
        senderType = "institution"
        institutionName = senderInstitutionProfile.institutionName
      }

      return {
        ...msgObj,
        senderType,
        teacherName,
        institutionName,
        message: msgObj.content // Add message field as alias for content
      }
    }))

    res.json(enhancedMessages)
  } catch (error) {
    console.error("Error getting messages:", error)
    res.status(500).json({ message: error.message })
  }
}

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId

    // Find all applications where user is either teacher or institution
    const teacherProfile = await require("../models/TeacherProfile").findOne({ userId })
    const institutionProfile = await require("../models/InstitutionProfile").findOne({ userId })

    let applications = []

    if (teacherProfile) {
      applications = await Application.find({ teacherId: teacherProfile._id })
        .populate({
          path: "jobId",
          populate: { path: "institutionId", select: "institutionName photo" },
        })
        .populate({
          path: "institutionId",
          select: "userId",
        })
    } else if (institutionProfile) {
      const jobs = await require("../models/Job").find({ institutionId: institutionProfile._id })
      const jobIds = jobs.map(job => job._id)
      applications = await Application.find({ jobId: { $in: jobIds } })
        .populate({
          path: "jobId",
          select: "title",
          populate: { path: "institutionId", select: "institutionName" },
        })
        .populate({
          path: "teacherId",
          select: "name userId",
        })
    }

    // Get conversations with latest message and unread count
    const conversations = []

    for (const application of applications) {
      const messages = await Message.find({ applicationId: application._id })
        .populate("senderId", "name")
        .populate("receiverId", "name")
        .sort({ createdAt: -1 })
        .limit(1)

      // Count unread messages for current user
      const unreadCount = await Message.countDocuments({
        applicationId: application._id,
        receiverId: userId,
        isRead: false,
      })

      // Determine the other participant
      let otherParticipant = null
      let otherParticipantId = null
      let latestMessage = "No messages yet"
      let latestMessageTime = application.createdAt

      if (messages.length > 0) {
        const message = messages[0]

        const sender = message.senderId
        const receiver = message.receiverId

        if (sender && sender._id && sender._id.toString() === userId.toString()) {
          otherParticipant = receiver
          otherParticipantId = receiver ? receiver._id : null
        } else {
          otherParticipant = sender
          otherParticipantId = sender ? sender._id : null
        }

        latestMessage = message.content
        latestMessageTime = message.createdAt
      } else {
        // No messages yet, determine other participant from application
        if (teacherProfile) {
          // User is teacher, other participant is institution
          otherParticipant = { name: application.jobId?.institutionId?.institutionName || "Institution" }
          otherParticipantId = application.institutionId?.userId
        } else if (institutionProfile) {
          // User is institution, other participant is teacher
          otherParticipant = { name: application.teacherId?.name || "Teacher" }
          otherParticipantId = application.teacherId?.userId
        }
      }

      conversations.push({
        applicationId: application._id,
        jobTitle: application.jobId ? application.jobId.title : "Job Unavailable",
        institutionName: application.jobId?.institutionId?.institutionName || "Institution",
        teacherName: application.teacherId?.name || "Teacher",
        otherParticipant: otherParticipant?.name || "Unknown",
        otherParticipantId,
        latestMessage,
        latestMessageTime,
        unreadCount,
        receiverId: otherParticipantId, // For frontend compatibility
      })
    }

    // Sort conversations by latest message time
    conversations.sort((a, b) => new Date(b.latestMessageTime) - new Date(a.latestMessageTime))

    res.json(conversations)
  } catch (error) {
    console.error("Error getting conversations:", error)
    res.status(500).json({ message: error.message })
  }
}

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { applicationId } = req.params
    const userId = req.user.userId

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" })
    }

    // Verify user is part of this application
    const application = await Application.findById(applicationId)
    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    const userProfile = await require("../models/TeacherProfile").findOne({ userId })
    const institutionProfile = await require("../models/InstitutionProfile").findOne({ userId })

    const isTeacher = userProfile && application.teacherId.toString() === userProfile._id.toString()
    const isInstitution = institutionProfile && application.institutionId.toString() === institutionProfile._id.toString()

    if (!isTeacher && !isInstitution) {
      return res.status(403).json({ message: "Unauthorized to mark messages as read for this application" })
    }

    // Mark messages as read where current user is the receiver
    await Message.updateMany(
      { applicationId, receiverId: userId, isRead: false },
      { isRead: true }
    )

    res.json({ message: "Messages marked as read" })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    res.status(500).json({ message: error.message })
  }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId

    // Count all unread messages where current user is the receiver
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    })

    res.json({ count: unreadCount })
  } catch (error) {
    console.error("Error getting unread count:", error)
    res.status(500).json({ message: error.message })
  }
}

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user.userId

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" })
    }

    // Find the message to verify ownership
    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ message: "Message not found" })
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" })
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId)

    res.json({ message: "Message deleted successfully" })
  } catch (error) {
    console.error("Error deleting message:", error)
    res.status(500).json({ message: error.message })
  }
}

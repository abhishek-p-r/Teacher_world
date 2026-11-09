const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")

// Teacher Registration (supports both /register-teacher and /register)
router.post("/register-teacher", authController.registerTeacher)
router.post("/register", authController.registerTeacher)

// Institution Registration (supports both /register-institution and /register/institution)
router.post("/register-institution", authController.registerInstitution)
router.post("/register/institution", authController.registerInstitution)
router.post("/verify-otp", authController.verifyOTP)
router.post("/login", authController.login)
router.post("/refresh", authController.refreshToken)
router.post("/forgot-password", authController.forgotPassword)
router.post("/reset-password", authController.resetPassword)

router.post("/forgot-username", authController.forgotUsername)
router.post("/verify-username-recovery", authController.verifyUsernameRecovery)
router.post("/google/callback", authController.googleCallback)

module.exports = router

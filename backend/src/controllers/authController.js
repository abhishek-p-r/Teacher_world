 const User = require("../models/User");
const OtpToken = require("../models/OtpToken");
const TeacherProfile = require("../models/TeacherProfile");
const InstitutionProfile = require("../models/InstitutionProfile");
const { sendOTP, sendOTPViaGmail } = require("../config/mailer");
const { logActivity } = require("../lib/activityLogger");
const { generateAccessToken, generateRefreshToken } = require("../config/jwt");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register new teacher
exports.registerTeacher = async (req, res) => {
  // Example: create new User with role teacher, create teacher profile, etc.
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const user = new User({
      email,
      password, // Assume password hashing is handled in model pre-save hooks
      name,
      role: "teacher",
      verified: false,
    });
    
    await user.save();
    await TeacherProfile.create({ userId: user._id });
    // Create OTP token and send verification email for registration
    try {
      // Check rate limiting
      const isRateLimited = await OtpToken.checkRateLimit(email);
      if (isRateLimited) {
        return res.status(429).json({
          message: "Too many OTP requests. Please try again in an hour."
        });
      }

      const otp = generateOTP();
      await OtpToken.createHashedOTP(email, otp, "registration");
      await sendOTPViaGmail(email, otp);
      logActivity({ userId: user._id, action: "register.teacher", req });
      try {
        if (global && global.io) global.io.emit('otp_sent', { email, success: true, context: 'registration' });
      } catch (e) {
        console.warn('[REGISTER] Could not emit otp_sent socket event (teacher):', e);
      }
    } catch (emailErr) {
      console.error('[REGISTER] Failed to send registration OTP:', emailErr);
      try {
        if (global && global.io) global.io.emit('otp_sent', { email, success: false, error: emailErr.message || String(emailErr), context: 'registration' });
      } catch (e) {
        console.warn('[REGISTER] Could not emit otp_sent failure socket event (teacher):', e);
      }
    }
    res.status(201).json({ message: "Teacher registered successfully" });
  } catch (err) {
    console.error("registerTeacher error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// Register new institution
exports.registerInstitution = async (req, res) => {
  try {
    const { email, password, institutionName } = req.body;
    if (!email || !password || !institutionName) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const user = new User({
      email,
      password,
      name: institutionName,
      role: "institution",
      verified: false,
    });
    
    await user.save();
    await InstitutionProfile.create({ userId: user._id, institutionName });
    // Create OTP token and send verification email for registration
    try {
      const otp = generateOTP();
      await OtpToken.createHashedOTP(email, otp, "registration");
      await sendOTPViaGmail(email, otp);
      logActivity({ userId: user._id, action: "register.institution", req });
      try {
        if (global && global.io) global.io.emit('otp_sent', { email, success: true, context: 'registration' });
      } catch (e) {
        console.warn('[REGISTER] Could not emit otp_sent socket event (institution):', e);
      }
    } catch (emailErr) {
      console.error('[REGISTER] Failed to send registration OTP (institution):', emailErr);
      try {
        if (global && global.io) global.io.emit('otp_sent', { email, success: false, error: emailErr.message || String(emailErr), context: 'registration' });
      } catch (e) {
        console.warn('[REGISTER] Could not emit otp_sent failure socket event (institution):', e);
      }
    }
    res.status(201).json({ message: "Institution registered successfully" });
  } catch (err) {
    console.error("registerInstitution error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    // Find the active OTP token for this email and purpose
    const otpToken = await OtpToken.findOne({
      email: email.toLowerCase().trim(),
      used: false,
      purpose: "registration"
    }).sort({ createdAt: -1 }); // Get the most recent one

    if (!otpToken) {
      return res.status(400).json({ message: "No valid OTP found. Please request a new one." });
    }

    // Verify the OTP using the secure method
    try {
      await otpToken.verifyOTP(otp);
    } catch (verifyError) {
      return res.status(400).json({ message: verifyError.message });
    }

    // OTP valid, mark user verified
    await User.updateOne({ email }, { verified: true });
    logActivity({ email, action: "verify.otp", req });

    // After verification, generate and return access & refresh tokens so frontend can authenticate immediately
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found after verification" });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: "OTP verified successfully",
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

// Refresh access token using a valid refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body || {}
    const tokenFromHeader = req.headers['authorization'] ? String(req.headers['authorization']).split(/\s+/).pop() : null
    const token = refreshToken || tokenFromHeader || req.cookies && req.cookies.refreshToken

    if (!token) return res.status(400).json({ message: 'Refresh token required' })

    const decoded = require('../config/jwt').verifyRefreshToken(token)
    if (!decoded || !decoded.userId) return res.status(403).json({ message: 'Invalid or expired refresh token' })

    const User = require('../models/User')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const accessToken = generateAccessToken(user._id, user.role)
    const newRefreshToken = generateRefreshToken(user._id)

    res.json({ accessToken, refreshToken: newRefreshToken, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (err) {
    console.error('refreshToken error:', err)
    res.status(500).json({ message: 'Failed to refresh token', error: err.message })
  }
}

// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      // Password not set, can't authenticate with password
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (!user.verified) {
      return res.status(403).json({ message: "User not verified" });
    }
    
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    logActivity({ userId: user._id, email, action: "login", req });
    res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check rate limiting
    const isRateLimited = await OtpToken.checkRateLimit(email);
    if (isRateLimited) {
      return res.status(429).json({
        message: "Too many password reset requests. Please try again in an hour."
      });
    }

    const otp = generateOTP();
    await OtpToken.createHashedOTP(email, otp, "password-reset");
    await sendOTPViaGmail(email, otp);
    logActivity({ userId: user._id, email, action: "forgot.password", req });
    res.json({ message: "Password reset OTP sent to your email" });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Failed to send password reset OTP", error: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password required" });
    }

    // Find the active OTP token for password reset
    const otpToken = await OtpToken.findOne({
      email: email.toLowerCase().trim(),
      used: false,
      purpose: "password-reset"
    }).sort({ createdAt: -1 }); // Get the most recent one

    if (!otpToken) {
      return res.status(400).json({ message: "No valid OTP found. Please request a new one." });
    }

    // Verify the OTP using the secure method
    try {
      await otpToken.verifyOTP(otp);
    } catch (verifyError) {
      return res.status(400).json({ message: verifyError.message });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();
    logActivity({ userId: user._id, email, action: "reset.password", req });
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Password reset failed", error: err.message });
  }
};

// Forgot username
exports.forgotUsername = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Here we assume username is same as email or implement logic as needed
    logActivity({ userId: user._id, email, action: "forgot.username", req });
    res.json({ message: `Your username is ${user.email}` });
  } catch (err) {
    console.error("forgotUsername error:", err);
    res.status(500).json({ message: "Failed to retrieve username", error: err.message });
  }
};

// Verify username recovery
exports.verifyUsernameRecovery = async (req, res) => {
  try {
    // Implement verification logic if applicable
    res.json({ message: "Username recovery verified" });
  } catch (err) {
    console.error("verifyUsernameRecovery error:", err);
    res.status(500).json({ message: "Username recovery verification failed", error: err.message });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token || !role) {
      return res.status(400).json({ message: "Token and role are required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || "",
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    if (!email || !name) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    let user = await User.findOne({ email, role });

    if (!user) {
      user = new User({
        email,
        name,
        role,
        verified: true,
        password: null,
      });
      await user.save();

      if (role === "teacher") {
        await TeacherProfile.create({ userId: user._id });
      } else if (role === "institution") {
        await InstitutionProfile.create({ userId: user._id, institutionName: name });
      }
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    logActivity({ userId: user._id, email, action: "google.login", req });

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[GOOGLE CALLBACK] Error:", error);
    res.status(500).json({ message: "Google login failed", error: error.message });
  }
};

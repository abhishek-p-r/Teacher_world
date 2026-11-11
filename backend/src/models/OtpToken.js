const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const otpTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["registration", "password-reset", "username-recovery"],
    default: "registration",
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5, // Allow up to 5 attempts before locking
  },
  used: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes validity
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-delete expired OTPs
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for active lookups
otpTokenSchema.index({ email: 1, purpose: 1, used: 1 });

// Instance method to verify OTP
otpTokenSchema.methods.verifyOTP = async function(candidateOTP) {
  if (this.used) {
    throw new Error("OTP has already been used. Please request a new one.");
  }

  if (this.attempts >= 5) {
    throw new Error("Maximum verification attempts exceeded. Please request a new OTP.");
  }

  if (Date.now() > this.expiresAt) {
    throw new Error("OTP has expired. Please request a new OTP.");
  }

  const cleanCandidate = String(candidateOTP || "").trim();
  if (!cleanCandidate) {
    throw new Error("OTP cannot be empty.");
  }

  const isMatch = await bcrypt.compare(cleanCandidate, this.otpHash);

  if (!isMatch) {
    this.attempts += 1;
    await this.save();
    const remaining = 5 - this.attempts;
    throw new Error(`Invalid OTP. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new OTP."}`);
  }

  // Mark as used on successful verification
  this.used = true;
  await this.save();

  return true;
};

// Static method to check rate limiting (max 6 requests per 5 minutes)
otpTokenSchema.statics.checkRateLimit = async function(email) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const recentOTPs = await this.countDocuments({
    email: normalizedEmail,
    createdAt: { $gte: fiveMinutesAgo },
  });

  return recentOTPs >= 6;
};

// Static method to create hashed OTP
otpTokenSchema.statics.createHashedOTP = async function(email, otp, purpose = "registration") {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const cleanOtp = String(otp || "").trim();
  const saltRounds = 10;
  const otpHash = await bcrypt.hash(cleanOtp, saltRounds);

  // Delete all previous unused OTPs for this email and purpose so only this new OTP is active
  await this.deleteMany({
    email: normalizedEmail,
    purpose,
    used: false,
  });

  return this.create({
    email: normalizedEmail,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes validity
    attempts: 0,
    used: false,
  });
};

module.exports = mongoose.model("OtpToken", otpTokenSchema);

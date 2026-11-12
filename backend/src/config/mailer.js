const nodemailer = require('nodemailer');
const axios = require('axios');

// Brevo Configuration (HTTPS Transactional Email API - Primary Mailer)
const BREVO_API_KEY = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
const BREVO_SENDER_EMAIL = (process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'a35406332@gmail.com').trim();
const BREVO_SENDER_NAME = (process.env.BREVO_SENDER_NAME || 'TeacherWorld').trim();

// Gmail Configuration (Direct SSL SMTP)
const GMAIL_USER = (process.env.GMAIL_USER || 'a35406332@gmail.com').trim();
const GMAIL_PASSWORD = (process.env.GMAIL_PASSWORD || 'tdyarpqvzmwjgjyy').replace(/\s+/g, '').trim();

// Timeout helper: guarantees an asynchronous operation never hangs indefinitely
const withTimeout = (promise, ms = 12000) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Create direct SSL transport for Gmail on Port 465
const createGmailTransport465 = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Create STARTTLS transport for Gmail on Port 587
const createGmailTransport587 = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

let defaultTransporter = createGmailTransport465();

/**
 * Send email via Brevo REST API (HTTPS Port 443)
 */
const sendViaBrevoAPI = async ({ to, subject, htmlContent, textContent }) => {
  if (!BREVO_API_KEY) {
    return { success: false, reason: 'BREVO_API_KEY not configured' };
  }

  const payload = {
    sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
    to: [{ email: to.toLowerCase().trim() }],
    subject,
    htmlContent,
    textContent: textContent || subject,
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      timeout: 5000,
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`[MAILER] Email successfully sent via Brevo API to ${to} (MessageId: ${response.data?.messageId || 'ok'})`);
      return { success: true, messageId: response.data?.messageId, provider: 'brevo-api' };
    }
    return { success: false, reason: `Brevo API HTTP status ${response.status}` };
  } catch (err) {
    const errorDetails = err.response?.data?.message || err.message;
    console.warn(`[MAILER] Brevo API sending note for ${to} (${errorDetails}). Trying SMTP fallback...`);
    return { success: false, reason: errorDetails };
  }
};

/**
 * Send OTP via Gmail Direct SSL / STARTTLS / Brevo
 */
const sendOTPViaGmail = async (email, otp) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const cleanOtp = String(otp || '').trim();
  const subject = `TeacherWorld - Your Verification Code is ${cleanOtp}`;
  const textContent = `Welcome to TeacherWorld!\n\nYour 6-digit email verification code is: ${cleanOtp}\n\nThis code will expire in 15 minutes.\nIf you did not request this code, please ignore this email.`;
  const htmlContent =
    '<div style="font-family: Arial, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">' +
    '<div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">' +
    '<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">TeacherWorld</h1>' +
    '<p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 15px;">Empowering Educators & Institutions</p>' +
    '</div>' +
    '<div style="padding: 36px 32px; background: #ffffff;">' +
    '<h2 style="color: #1e293b; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Email Verification Required</h2>' +
    '<p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">' +
    'Thank you for registering with TeacherWorld. To complete your registration and activate your account, please enter the 6-digit verification code below:' +
    '</p>' +
    '<div style="background: #f8fafc; padding: 24px; text-align: center; border-radius: 10px; margin: 24px 0; border: 2px dashed #6366f1;">' +
    '<span style="color: #4338ca; letter-spacing: 8px; font-size: 36px; font-weight: 800; font-family: monospace; display: inline-block;">' +
    cleanOtp +
    '</span>' +
    '</div>' +
    '<div style="background: #f1f5f9; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">' +
    '<p style="color: #334155; font-size: 13px; margin: 0; line-height: 1.5;">' +
    '⏳ <strong>Security Notice:</strong> This code is valid for <strong>15 minutes</strong>. Never share this code with anyone.' +
    '</p>' +
    '</div>' +
    '<p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">' +
    'If you did not attempt to register on TeacherWorld, please disregard this email or contact support.' +
    '</p>' +
    '</div>' +
    '<div style="background: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">' +
    '<p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 TeacherWorld. All rights reserved.</p>' +
    '</div>' +
    '</div>';

  const mailOptions = {
    from: `"TeacherWorld Support" <${GMAIL_USER}>`,
    to: normalizedEmail,
    subject,
    text: textContent,
    html: htmlContent,
  };

  let lastError = null;

  // 1. PRIMARY: Try Brevo REST API first (as requested by user)
  if (BREVO_API_KEY) {
    try {
      console.log(`[MAILER] Dispatching OTP to ${normalizedEmail} via Brevo API...`);
      const brevoRes = await sendViaBrevoAPI({
        to: normalizedEmail,
        subject,
        htmlContent,
        textContent,
      });
      if (brevoRes.success) {
        console.log(`[MAILER] OTP successfully delivered to ${normalizedEmail} via Brevo API!`);
        return brevoRes;
      }
      console.warn(`[MAILER] Brevo API sending failed (${brevoRes.reason}). Falling back to Gmail SMTP...`);
      lastError = new Error(brevoRes.reason || 'Brevo API error');
    } catch (brevoErr) {
      console.warn(`[MAILER] Brevo API exception (${brevoErr.message}). Falling back to Gmail SMTP...`);
      lastError = brevoErr;
    }
  }

  // 2. FALLBACK: Try Gmail Direct SSL (Port 465)
  if (GMAIL_USER && GMAIL_PASSWORD) {
    try {
      const t465 = createGmailTransport465();
      const result = await withTimeout(t465.sendMail(mailOptions), 10000);
      console.log(`[MAILER] OTP successfully sent via Gmail Port 465 fallback to ${normalizedEmail} (MessageId: ${result.messageId})`);
      return { success: true, messageId: result.messageId, provider: 'gmail-smtp-465' };
    } catch (err465) {
      console.warn(`[MAILER] Gmail Port 465 fallback failed (${err465.message}). Trying Port 587...`);
      lastError = err465;
    }

    // 3. SECOND FALLBACK: Try Gmail STARTTLS (Port 587)
    try {
      const t587 = createGmailTransport587();
      const result = await withTimeout(t587.sendMail(mailOptions), 10000);
      console.log(`[MAILER] OTP successfully sent via Gmail Port 587 fallback to ${normalizedEmail} (MessageId: ${result.messageId})`);
      return { success: true, messageId: result.messageId, provider: 'gmail-smtp-587' };
    } catch (err587) {
      console.warn(`[MAILER] Gmail Port 587 fallback failed (${err587.message}).`);
      lastError = err587;
    }
  }

  console.error(`[MAILER] ALL email delivery providers failed for ${normalizedEmail}:`, lastError?.message || lastError);
  return {
    success: false,
    error: lastError ? lastError.message : 'No email transport succeeded'
  };
};

const sendOTP = async (email, otp) => {
  return sendOTPViaGmail(email, otp);
};

const sendStatusUpdate = async (email, jobTitle, status, notes = '', institutionName = '', teacherName = '') => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const safeNotes = notes
    ? notes
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
    : '';

  const subject = `Application Status Update - ${jobTitle}`;
  const htmlContent =
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">` +
    `<div style="background-color: #4f46e5; padding: 20px; text-align: center;">` +
    `<h1 style="color: #fff; font-size: 24px; margin: 0;">TeacherWorld</h1>` +
    `</div>` +
    `<div style="padding: 30px; background: #f8fafc;">` +
    `<h2 style="color: #1e293b; margin-top: 0;">Application Status Update</h2>` +
    `<p><strong>Dear ${teacherName || 'Teacher'},</strong></p>` +
    `<p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${institutionName || 'the institution'}</strong> has been updated.</p>` +
    `<div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4f46e5;">` +
    `<p style="margin: 0;"><strong>Current Status:</strong> <span style="color: #4f46e5; text-transform: uppercase; font-weight: bold;">${status}</span></p>` +
    `</div>` +
    (safeNotes ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;"><p style="margin: 0;"><strong>Additional Notes:</strong></p><p style="margin: 10px 0 0 0;">${safeNotes}</p></div>` : '') +
    `<p style="color: #64748b; font-size: 14px; margin-top: 24px;">Log in to your TeacherWorld account to view complete details.</p>` +
    `</div>` +
    `</div>`;

  const mailOptions = {
    from: `"TeacherWorld Support" <${GMAIL_USER}>`,
    to: normalizedEmail,
    subject,
    html: htmlContent,
  };

  try {
    const t465 = createGmailTransport465();
    const result = await withTimeout(t465.sendMail(mailOptions), 10000);
    return { success: true, messageId: result.messageId, provider: 'gmail-465' };
  } catch (err465) {
    try {
      const t587 = createGmailTransport587();
      const result = await withTimeout(t587.sendMail(mailOptions), 10000);
      return { success: true, messageId: result.messageId, provider: 'gmail-587' };
    } catch (err587) {
      if (BREVO_API_KEY) {
        return sendViaBrevoAPI({ to: normalizedEmail, subject, htmlContent });
      }
      return { success: false, error: err587.message };
    }
  }
};

module.exports = {
  sendOTP,
  sendStatusUpdate,
  transporter: defaultTransporter,
  sendOTPViaGmail,
  sendOTPEmail: sendOTPViaGmail,
};

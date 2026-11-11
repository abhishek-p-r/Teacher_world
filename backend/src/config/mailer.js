const nodemailer = require('nodemailer');
const axios = require('axios');

// Brevo Configuration (HTTPS Transactional Email API)
const BREVO_API_KEY = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
const BREVO_SENDER_EMAIL = (process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'a35406332@gmail.com').trim();
const BREVO_SENDER_NAME = (process.env.BREVO_SENDER_NAME || 'TeacherWorld').trim();

// Gmail Configuration (Direct SSL SMTP fallback)
const GMAIL_USER = (process.env.GMAIL_USER || 'a35406332@gmail.com').trim();
const GMAIL_PASSWORD = (process.env.GMAIL_PASSWORD || 'tdyarpqvzmwjgjyy').replace(/\s+/g, '').trim();

let transporter = null;
let usingEthereal = false;
let gmailTransport = null;

// Timeout helper: guarantees an asynchronous operation never hangs longer than `ms`
const withTimeout = (promise, ms = 8000) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Create direct SSL transport for Gmail on Port 465 (most reliable from cloud containers)
const createGmailTransport = () => {
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

const initTransporter = async () => {
  if (GMAIL_USER && GMAIL_PASSWORD) {
    try {
      gmailTransport = createGmailTransport();
      await withTimeout(gmailTransport.verify(), 5000);
      transporter = gmailTransport;
      usingEthereal = false;
      console.log('[MAILER] Gmail SMTP transporter ready');
      return;
    } catch (gmailErr) {
      console.warn('[MAILER] Gmail verification note:', gmailErr.message || gmailErr);
      gmailTransport = null;
      transporter = null;
    }
  }

  // Fallback to local JSON transport in test/offline environments
  try {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    usingEthereal = false;
    console.log('[MAILER] Local JSON transport ready as standby');
  } catch (fallbackErr) {
    console.error('[MAILER] Failed to create standby transport:', fallbackErr);
    transporter = null;
  }
};

initTransporter().catch(err => {
  console.warn('[MAILER] Background initTransporter note:', err.message);
});

/**
 * Send email via Brevo REST API (HTTPS Port 443)
 * Completely immune to cloud hosting SMTP port throttling / STARTTLS timeouts
 */
const sendViaBrevoAPI = async ({ to, subject, htmlContent }) => {
  if (!BREVO_API_KEY) {
    return { success: false, reason: 'BREVO_API_KEY not configured' };
  }

  const payload = {
    sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
    to: [{ email: to.toLowerCase().trim() }],
    subject,
    htmlContent,
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      timeout: 6000,
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`[MAILER] Email successfully sent via Brevo API to ${to} (MessageId: ${response.data?.messageId || 'ok'})`);
      return { success: true, messageId: response.data?.messageId, provider: 'brevo-api' };
    }
    return { success: false, reason: `Brevo API HTTP status ${response.status}` };
  } catch (err) {
    const errorDetails = err.response?.data?.message || err.message;
    console.warn(`[MAILER] Brevo API sending notice for ${to} (${errorDetails}). Trying SMTP fallback...`);
    return { success: false, reason: errorDetails };
  }
};

/**
 * Send OTP with dual-delivery architecture:
 * 1. Brevo REST API (Fast HTTPS, zero port blocks)
 * 2. Gmail SMTP Direct SSL (Port 465)
 * 3. Log to console fallback (Never fails the HTTP registration request)
 */
const sendOTPViaGmail = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const subject = 'TeacherWorld - Email Verification OTP';
  const htmlContent =
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
    '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">' +
    '<h1 style="color: white; margin: 0;">TeacherWorld</h1>' +
    '</div>' +
    '<div style="padding: 30px; background: #f9f9f9;">' +
    '<h2 style="color: #333; margin-top: 0;">Email Verification</h2>' +
    '<p style="color: #666; font-size: 16px;">Your OTP for TeacherWorld registration is:</p>' +
    '<div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea;">' +
    `<h1 style="color: #667eea; letter-spacing: 5px; margin: 0; font-size: 32px;">${otp}</h1>` +
    '</div>' +
    '<p style="color: #666; font-size: 14px;">This OTP will expire in <strong>10 minutes</strong>.</p>' +
    '<p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">If you didn\'t request this, please ignore this email.</p>' +
    '</div>' +
    '</div>';

  // 1. Try Brevo REST API first
  const brevoRes = await sendViaBrevoAPI({ to: normalizedEmail, subject, htmlContent });
  if (brevoRes.success) {
    return brevoRes;
  }

  // 2. Fall back to Gmail Direct SSL SMTP (Port 465)
  if (GMAIL_USER && GMAIL_PASSWORD) {
    let transportToUse = gmailTransport;
    if (!transportToUse) {
      transportToUse = createGmailTransport();
    }

    const mailOptions = {
      from: `"TeacherWorld" <${GMAIL_USER}>`,
      to: normalizedEmail,
      subject,
      html: htmlContent,
    };

    try {
      const result = await withTimeout(transportToUse.sendMail(mailOptions), 8000);
      console.log(`[MAILER] Email successfully sent via Gmail SMTP to ${normalizedEmail} (MessageId: ${result.messageId || 'ok'})`);
      return { success: true, messageId: result.messageId, provider: 'gmail-smtp' };
    } catch (gmailErr) {
      console.warn(`[MAILER] Gmail SMTP send timed out/failed for ${normalizedEmail} (${gmailErr.message}).`);
    }
  }

  // 3. Fallback console logging
  console.log(`[OTP-FALLBACK] Verification OTP for ${normalizedEmail}: ${otp}`);
  return { success: true, messageId: 'simulated-fallback', fallback: true };
};

const sendOTP = async (email, otp) => {
  return sendOTPViaGmail(email, otp);
};

const sendStatusUpdate = async (email, jobTitle, status, notes = '', institutionName = '', teacherName = '') => {
  const normalizedEmail = email.toLowerCase().trim();
  const safeNotes = notes
    ? notes
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
    : '';

  const subject = 'Application Status Update - ' + jobTitle;
  const htmlContent =
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">' +
    '<div style="background-color: #0070f3; padding: 15px; text-align: center;">' +
    `<h1 style="color: #fff; font-size: 24px; margin: 0;">TeacherWorld</h1>` +
    '</div>' +
    '<div style="padding: 30px; background: #f7f7f7;">' +
    `<h2 style="color: #1a5490; margin-top: 0;">Application Status Update</h2>` +
    `<p><strong>Dear ${teacherName || 'Teacher'},</strong></p>` +
    `<p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${institutionName || 'the institution'}</strong> has been updated.</p>` +
    '<div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0070f3;">' +
    `<p style="margin: 0;"><strong>Current Status:</strong> <span style="color: #0070f3; text-transform: uppercase; font-weight: bold;">${status}</span></p>` +
    '</div>' +
    (safeNotes ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;"><p style="margin: 0;"><strong>Additional Notes:</strong></p><p style="margin: 10px 0 0 0;">${safeNotes}</p></div>` : '') +
    '<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">' +
    '<p style="color: #666; font-size: 14px; margin: 0;">Log in to your TeacherWorld account for more details and to track your application progress.</p>' +
    '</div>' +
    '</div>' +
    '<div style="background: #333; padding: 15px; text-align: center;">' +
    '<p style="color: #999; font-size: 12px; margin: 0;">© 2026 TeacherWorld. All rights reserved.</p>' +
    '</div>' +
    '</div>';

  // 1. Try Brevo REST API first
  const brevoRes = await sendViaBrevoAPI({ to: normalizedEmail, subject, htmlContent });
  if (brevoRes.success) {
    return brevoRes;
  }

  // 2. Try Gmail SMTP
  if (GMAIL_USER && GMAIL_PASSWORD) {
    let transportToUse = gmailTransport;
    if (!transportToUse) {
      transportToUse = createGmailTransport();
    }

    try {
      const result = await withTimeout(
        transportToUse.sendMail({
          from: `"TeacherWorld" <${GMAIL_USER}>`,
          to: normalizedEmail,
          subject,
          html: htmlContent,
        }),
        8000
      );
      return { success: true, messageId: result.messageId, provider: 'gmail-smtp' };
    } catch (err) {
      console.error('[MAILER] Status update SMTP failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'No email service available' };
};

module.exports = { sendOTP, sendStatusUpdate, transporter, sendOTPViaGmail };

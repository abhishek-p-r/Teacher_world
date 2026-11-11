const nodemailer = require('nodemailer');

// Read and normalize credentials (trim and remove accidental spaces)
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

const createGmailTransport = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 10000,   // 10s greeting timeout
    socketTimeout: 15000,     // 15s socket idle timeout
    tls: {
      rejectUnauthorized: false
    }
  });
};

const initTransporter = async () => {
  // If Gmail creds are present, try to use Gmail for real delivery.
  if (GMAIL_USER && GMAIL_PASSWORD) {
    try {
      gmailTransport = createGmailTransport();
      // Verify with 5s timeout; if verification fails or hangs, fallback gracefully
      await withTimeout(gmailTransport.verify(), 5000);
      transporter = gmailTransport;
      usingEthereal = false;
      console.log('[MAILER] Gmail transporter ready; real emails will be sent');
      return;
    } catch (gmailErr) {
      console.warn('[MAILER] Gmail transporter verification failed/timed out; falling back to fallback transport:', gmailErr.message || gmailErr);
      gmailTransport = null;
      transporter = null;
    }
  }

  // Create Ethereal test account (development fallback)
  try {
    const testAccount = await withTimeout(nodemailer.createTestAccount(), 4000);
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
      connectionTimeout: 4000,
      socketTimeout: 4000,
    });
    usingEthereal = true;
    console.log('[MAILER] Using Ethereal test account for emails (development)');
  } catch (err) {
    // Network may be offline in dev/sandbox. Fall back to local JSON transport so the
    // server starts cleanly and emails are logged as JSON objects without errors.
    try {
      transporter = nodemailer.createTransport({ jsonTransport: true });
      usingEthereal = false;
      console.log('[MAILER] Using local JSON transport for emails (offline fallback)');
    } catch (fallbackErr) {
      console.error('[MAILER] Failed to create fallback transport:', fallbackErr);
      transporter = null;
    }
  }
};

// Initialize immediately (non-blocking)
initTransporter().catch(err => {
  console.warn('[MAILER] Background initTransporter warning:', err.message);
});

// Send OTP using Gmail SMTP explicitly (used for registration flows)
const sendOTPViaGmail = async (email, otp) => {
  if (!GMAIL_USER || !GMAIL_PASSWORD) {
    console.warn('[MAILER] Gmail credentials not set; using default transport');
    return sendOTP(email, otp);
  }

  let transportToUse = gmailTransport;
  if (!transportToUse) {
    transportToUse = createGmailTransport();
  }

  const mailOptions = {
    from: `"TeacherWorld" <${GMAIL_USER}>`,
    to: email,
    subject: 'TeacherWorld - Email Verification OTP',
    html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
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
      '</div>'
  };

  try {
    // Send email with strict 8s timeout so caller is NEVER blocked indefinitely
    const result = await withTimeout(transportToUse.sendMail(mailOptions), 8000);
    console.log('[MAILER] Gmail send result for', email, result.messageId ? result.messageId : '');
    return result;
  } catch (err) {
    console.warn(`[MAILER] Gmail send timed out or failed for ${email} (${err.message}). Logging OTP to console.`);
    console.log(`[OTP-FALLBACK] Verification OTP for ${email}: ${otp}`);
    return { success: true, messageId: 'simulated-timeout', fallback: true };
  }
};

const sendOTP = async (email, otp) => {
  const fromAddress = GMAIL_USER ? `"TeacherWorld" <${GMAIL_USER}>` : '"TeacherWorld" <no-reply@teacherworld.com>';

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'TeacherWorld - Email Verification OTP',
    html:
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
      '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">' +
      '<h1 style="color: white; margin: 0;">TeacherWorld</h1>' +
      '</div>' +
      '<div style="padding: 30px; background: #f9f9f9;">' +
      '<h2 style="color: #333; margin-top: 0;">Email Verification</h2>' +
      '<p style="color: #666; font-size: 16px;">Your OTP for TeacherWorld verification is:</p>' +
      '<div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea;">' +
      `<h1 style="color: #667eea; letter-spacing: 5px; margin: 0; font-size: 32px;">${otp}</h1>` +
      '</div>' +
      '<p style="color: #666; font-size: 14px;">This OTP will expire in <strong>10 minutes</strong>.</p>' +
      '<p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">If you didn\'t request this, please ignore this email.</p>' +
      '</div>' +
      '</div>',
  };

  try {
    if (!transporter) {
      await withTimeout(initTransporter(), 4000);
    }
    const result = await withTimeout(
      transporter ? transporter.sendMail(mailOptions) : Promise.resolve({ messageId: 'simulated-offline' }),
      6000
    );
    console.log('[MAILER] Email send result for', email, result.messageId ? result.messageId : '');
    try {
      const preview = nodemailer.getTestMessageUrl(result);
      if (preview) console.log('[MAILER] Preview URL:', preview);
    } catch (e) {}
    return result;
  } catch (error) {
    console.warn(`[MAILER] Email send timed out or failed for ${email} (${error.message}). Logging OTP.`);
    console.log(`[OTP-FALLBACK] Verification OTP for ${email}: ${otp}`);
    return { success: true, messageId: 'simulated-fallback', fallback: true };
  }
};

const sendStatusUpdate = async (email, jobTitle, status, notes = '', institutionName = '', teacherName = '') => {
  const safeNotes = notes
    ? notes
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
    : '';

  const mailOptions = {
    from: GMAIL_USER || 'no-reply@teacherworld.com',
    to: email,
    subject: 'Application Status Update - ' + jobTitle,
    html:
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
      '</div>',
  };

  try {
    if (!transporter) {
      await withTimeout(initTransporter(), 4000);
    }
    const result = await withTimeout(
      transporter ? transporter.sendMail(mailOptions) : Promise.resolve({ messageId: 'simulated-offline' }),
      6000
    );
    console.log('[MAILER] Status update email send result for', email, result.messageId ? result.messageId : '');
    return result;
  } catch (error) {
    console.error('[MAILER] Error sending status update email:', error && error.message ? error.message : error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP, sendStatusUpdate, transporter, sendOTPViaGmail };

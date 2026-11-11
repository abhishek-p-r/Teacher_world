const express = require('express')
const router = express.Router()
const { verifyAccessToken } = require('../config/jwt')

// Dev-only token inspector. Returns decoded token if valid.
router.get('/token', (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || ''
    let token = authHeader.split(/\s+/).pop()
    if (!token) return res.status(400).json({ message: 'Authorization header required: Bearer <token>' })

    // Normalize similar to middleware
    token = String(token).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')
    try { token = decodeURIComponent(token) } catch (e) {}

    const decoded = verifyAccessToken(token)
    if (!decoded) return res.status(403).json({ message: 'Invalid or expired token' })

    res.json({ decoded })
  } catch (err) {
    res.status(500).json({ message: 'Debug endpoint error', error: err.message })
  }
})

// Test email delivery endpoint (diagnose Brevo API and Gmail SMTP in production)
router.get('/test-email', async (req, res) => {
  try {
    const to = req.query.to || 'a35406332@gmail.com'
    const { sendOTPViaGmail } = require('../config/mailer')
    const result = await sendOTPViaGmail(to, '999888')
    res.json({ success: true, to, result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router

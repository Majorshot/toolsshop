const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../utils/db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { generateToken, requireAuth, safeCompare } = require('../utils/auth');

// In-memory OTP storage with automatic TTL cleanup
// Key: cleanPhone -> { otp, expiresAt, purpose, customerDoc, registerData, lastSentAt, attempts }
const otpStore = new Map();

// Periodic cleanup of expired OTPs every minute
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 60000);
if (cleanupTimer.unref) cleanupTimer.unref();

/**
 * Generate cryptographically secure 6-digit numeric OTP
 */
function generateSecureOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

// POST /api/auth/send-otp - Dispatch 6-digit OTP via Email/WhatsApp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, purpose = 'login', name, email } = req.body;
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    // Rate limiting check: 25 seconds cooldown between sends
    const existing = otpStore.get(cleanPhone);
    if (existing && Date.now() - existing.lastSentAt < 25000) {
      const waitSec = Math.ceil((25000 - (Date.now() - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec}s before requesting a new code.`
      });
    }

    let customerDoc = null;
    let targetEmail = (email || '').trim();
    let customerName = (name || '').trim();

    if (purpose === 'login') {
      customerDoc = await db.lookupCustomerByPhone(cleanPhone);
      if (!customerDoc) {
        return res.status(404).json({
          success: false,
          message: 'No registered account found with this mobile number. Please switch to "New Customer" to create an account.'
        });
      }
      targetEmail = customerDoc.email || '';
      customerName = customerDoc.name || 'Valued Customer';
    } else {
      // Registration validation
      if (!customerName) {
        return res.status(400).json({ success: false, message: 'Full name is required for registration.' });
      }
      if (!targetEmail || !targetEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'A valid email address is required.' });
      }

      // Check if already registered
      const existingCust = await db.lookupCustomerByPhone(cleanPhone);
      if (existingCust) {
        return res.status(409).json({
          success: false,
          message: 'An account with this mobile number already exists. Please sign in instead.'
        });
      }
    }

    // Generate secure 6-digit numeric OTP with crypto.randomInt
    const otp = generateSecureOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanPhone, {
      otp,
      expiresAt,
      purpose,
      customerDoc,
      registerData: purpose === 'register' ? { name: customerName, phone: cleanPhone, email: targetEmail } : null,
      lastSentAt: Date.now(),
      attempts: 0
    });

    console.log(`[Auth OTP] Generated OTP for +91 ${cleanPhone} (${purpose})`);

    // Dispatch email if target email available
    if (targetEmail && targetEmail.includes('@')) {
      emailService.sendOtpEmail({
        to: targetEmail,
        name: customerName,
        otp,
        purpose
      }).catch(err => {
        console.warn('[Auth OTP] Email send error:', err.message);
      });
    }

    // Try WhatsApp dispatch if configured
    try {
      if (whatsappService && typeof whatsappService.sendWhatsAppMessage === 'function') {
        const waMsg = `🔐 *Variathu Power Tools Security Code*\n\nYour 6-digit verification OTP is: *${otp}*\n\nThis code is valid for 10 minutes. Please do not share this one-time code with anyone.\n_Kozhencherry, Pathanamthitta, Kerala_`;
        whatsappService.sendWhatsAppMessage(cleanPhone, waMsg).catch(() => {});
      }
    } catch (e) {}

    // Mask phone and email for user privacy display
    const maskedPhone = `+91 ${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`;
    const maskedEmail = targetEmail && targetEmail.includes('@')
      ? `${targetEmail.slice(0, 2)}••••@${targetEmail.split('@')[1]}`
      : null;

    // Secure: Only expose devOtp if explicitly configured in non-production environment
    const isLocalDevOtp = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_OTP === 'true';

    return res.json({
      success: true,
      message: `Verification code sent to ${maskedPhone}${maskedEmail ? ` and ${maskedEmail}` : ''}.`,
      maskedDestination: maskedEmail ? `${maskedPhone} & ${maskedEmail}` : maskedPhone,
      ...(isLocalDevOtp ? { devOtp: otp } : {}),
      expiresAt
    });
  } catch (err) {
    console.error('[Auth OTP] Error in /send-otp:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispatch verification code' });
  }
});

// POST /api/auth/verify-otp - Validate 6-digit OTP & sign in or register customer
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
    const submittedOtp = String(otp || '').trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required.' });
    }
    if (!submittedOtp || submittedOtp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter the 6-digit OTP.' });
    }

    const record = otpStore.get(cleanPhone);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP found for this number or it has expired. Please request a new code.'
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired. Please request a fresh verification code.'
      });
    }

    // Brute-force check: Limit invalid OTP attempts to 5
    if (record.attempts >= 5) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({
        success: false,
        message: 'Too many failed verification attempts. For your security, this code was invalidated. Please request a new code.'
      });
    }

    if (record.otp !== submittedOtp) {
      record.attempts = (record.attempts || 0) + 1;
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid 6-digit OTP. ${remaining} attempt(s) remaining.`
      });
    }

    // OTP Verified! Delete used OTP
    otpStore.delete(cleanPhone);

    if (record.purpose === 'register' && record.registerData) {
      // Create new customer account
      const newCust = await db.findOrCreateCustomer({
        phone: cleanPhone,
        name: record.registerData.name,
        email: record.registerData.email,
        district: 'Pathanamthitta',
        pincode: '689641'
      });

      // Send welcome email asynchronously
      emailService.sendWelcomeEmail(newCust).catch(err => {
        console.warn(`[Resend Email] Welcome email error:`, err.message);
      });

      const userObj = {
        id: newCust._id,
        name: newCust.name,
        phone: newCust.phone,
        email: newCust.email || '',
        address: newCust.address || '',
        landmark: newCust.landmark || '',
        district: newCust.district || 'Pathanamthitta',
        state: newCust.state || 'Kerala',
        pincode: newCust.pincode || '689641',
        savedAddresses: newCust.savedAddresses || [],
        cart: [],
        role: 'customer',
        location: `${newCust.district || 'Pathanamthitta'}, Kerala`
      };

      const token = generateToken({
        id: String(newCust._id),
        phone: newCust.phone,
        role: 'customer'
      });

      return res.json({
        success: true,
        isNewAccount: true,
        token,
        message: 'Account verified and registered successfully!',
        user: userObj
      });
    } else {
      // Login flow
      const customerDoc = await db.lookupCustomerByPhone(cleanPhone);
      if (!customerDoc) {
        return res.status(404).json({ success: false, message: 'Customer record not found.' });
      }

      const userObj = {
        id: customerDoc._id,
        name: customerDoc.name,
        phone: customerDoc.phone,
        email: customerDoc.email || '',
        address: customerDoc.address || '',
        landmark: customerDoc.landmark || '',
        district: customerDoc.district || 'Pathanamthitta',
        state: customerDoc.state || 'Kerala',
        pincode: customerDoc.pincode || '689641',
        savedAddresses: customerDoc.savedAddresses || [],
        cart: Array.isArray(customerDoc.cart) ? customerDoc.cart : [],
        role: 'customer',
        location: `${customerDoc.district || 'Pathanamthitta'}, Kerala`
      };

      const token = generateToken({
        id: String(customerDoc._id),
        phone: customerDoc.phone,
        role: 'customer'
      });

      return res.json({
        success: true,
        token,
        message: 'Successfully verified and signed in!',
        user: userObj
      });
    }
  } catch (err) {
    console.error('[Auth OTP] Error in /verify-otp:', err);
    return res.status(500).json({ success: false, message: 'Authentication verification error' });
  }
});

// POST /api/auth/resend-otp - Quick resend endpoint
router.post('/resend-otp', async (req, res) => {
  const { phone, purpose } = req.body;
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
  const existing = otpStore.get(cleanPhone);

  const payload = {
    phone: cleanPhone,
    purpose: purpose || existing?.purpose || 'login',
    name: existing?.registerData?.name,
    email: existing?.registerData?.email
  };

  req.body = payload;
  return router.handle({ ...req, url: '/send-otp', originalUrl: '/api/auth/send-otp' }, res);
});

// POST login endpoint - Secured Store Owner & Customer Authentication
router.post('/login', async (req, res) => {
  try {
    const { role, identifier, password } = req.body;

    if (role === 'store') {
      // Store Owner / Admin Login
      const configuredEmail = (process.env.STORE_ADMIN_EMAIL || 'admin@variathupowertools.com').trim().toLowerCase();
      const validPass = process.env.STORE_ADMIN_PASSWORD || 'admin123';
      const inputEmail = String(identifier || '').trim().toLowerCase();
      const inputPass = String(password || '');

      // Allow configured email, standard domain aliases, and shorthand 'admin'
      const allowedAdminEmails = new Set([
        configuredEmail,
        'admin@variathupowertools.com',
        'admin@variathutools.com',
        'admin'
      ]);

      const isEmailValid = allowedAdminEmails.has(inputEmail);
      const isPasswordValid = safeCompare(inputPass, validPass);

      // Strict constant-time credential comparison (prevents timing attacks & requires both email and password)
      if (isEmailValid && isPasswordValid) {
        const token = generateToken({
          id: 'admin-01',
          name: 'Store Manager',
          email: configuredEmail,
          role: 'store'
        });

        return res.json({
          success: true,
          token,
          user: {
            id: 'admin-01',
            name: 'Store Manager',
            email: configuredEmail,
            role: 'store',
            shop: 'Variathu Power Tools, Kozhencherry'
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid store credentials. Please check your admin username and password.'
        });
      }
    } else {
      // Customer Login Flow
      const phone = String(identifier || '').replace(/[^0-9]/g, '').slice(-10);
      if (!phone || phone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
      }

      const customerDoc = await db.lookupCustomerByPhone(phone);
      if (!customerDoc) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this mobile number. Please register first.'
        });
      }

      const userObj = {
        id: customerDoc._id,
        name: customerDoc.name,
        phone: customerDoc.phone,
        email: customerDoc.email || '',
        address: customerDoc.address || '',
        landmark: customerDoc.landmark || '',
        district: customerDoc.district || 'Pathanamthitta',
        state: customerDoc.state || 'Kerala',
        pincode: customerDoc.pincode || '689641',
        savedAddresses: customerDoc.savedAddresses || [],
        cart: Array.isArray(customerDoc.cart) ? customerDoc.cart : [],
        role: 'customer',
        location: `${customerDoc.district || 'Pathanamthitta'}, Kerala`
      };

      const token = generateToken({
        id: String(customerDoc._id),
        phone: customerDoc.phone,
        role: 'customer'
      });

      return res.json({
        success: true,
        token,
        user: userObj
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Authentication processing error' });
  }
});

// GET /api/auth/me - Verify active session and return authenticated user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'store') {
      const validEmail = process.env.STORE_ADMIN_EMAIL || 'admin@variathupowertools.com';
      return res.json({
        success: true,
        user: {
          id: 'admin-01',
          name: 'Store Manager',
          email: validEmail,
          role: 'store',
          shop: 'Variathu Power Tools, Kozhencherry'
        }
      });
    }

    const customerDoc = await db.lookupCustomerByPhone(req.user.phone);
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    return res.json({
      success: true,
      user: {
        id: customerDoc._id,
        name: customerDoc.name,
        phone: customerDoc.phone,
        email: customerDoc.email || '',
        address: customerDoc.address || '',
        landmark: customerDoc.landmark || '',
        district: customerDoc.district || 'Pathanamthitta',
        state: customerDoc.state || 'Kerala',
        pincode: customerDoc.pincode || '689641',
        savedAddresses: customerDoc.savedAddresses || [],
        cart: Array.isArray(customerDoc.cart) ? customerDoc.cart : [],
        role: 'customer',
        location: `${customerDoc.district || 'Pathanamthitta'}, Kerala`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Session verification error' });
  }
});

// GET check customer phone existence (Instant Blinkit/Zepto-style account check)
router.get('/check-phone/:phone', async (req, res) => {
  try {
    const rawPhone = String(req.params.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (!rawPhone || rawPhone.length !== 10) {
      return res.json({ success: true, exists: false });
    }
    const customerDoc = await db.lookupCustomerByPhone(rawPhone);
    if (customerDoc) {
      return res.json({
        success: true,
        exists: true,
        name: customerDoc.name,
        hasAddress: !!(customerDoc.address && customerDoc.pincode),
        district: customerDoc.district || 'Pathanamthitta'
      });
    }
    return res.json({
      success: true,
      exists: false
    });
  } catch (err) {
    res.status(500).json({ success: false, exists: false, message: 'Check phone error' });
  }
});

// POST register endpoint - Create new customer account
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required.' });
    }

    const cleanEmail = (email && email.trim().includes('@'))
      ? email.trim().toLowerCase()
      : `${cleanPhone}@customer.variathupowertools.com`;

    // Check if phone already registered
    const existingByPhone = await db.lookupCustomerByPhone(cleanPhone);
    if (existingByPhone) {
      return res.status(409).json({
        success: false,
        message: 'An account with this mobile number already exists. Please login instead.'
      });
    }

    // Check if email already registered (only for user-provided real emails)
    if (email && email.trim().includes('@')) {
      const existingByEmail = await db.lookupCustomerByEmail(email.trim());
      if (existingByEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please login with your mobile number.'
        });
      }
    }

    // Create new customer
    const customerDoc = await db.findOrCreateCustomer({
      phone: cleanPhone,
      name: name.trim(),
      email: cleanEmail,
      address: req.body.address || '',
      district: req.body.district || 'Pathanamthitta',
      pincode: req.body.pincode || '689641'
    });

    // Send welcome email if valid customer email provided
    if (email && email.trim().includes('@')) {
      emailService.sendWelcomeEmail(customerDoc).catch(err => {
        console.warn(`[Resend Email] Welcome email error:`, err.message);
      });
    }

    const userObj = {
      id: customerDoc._id,
      name: customerDoc.name,
      phone: customerDoc.phone,
      email: customerDoc.email || '',
      address: customerDoc.address || '',
      landmark: customerDoc.landmark || '',
      district: customerDoc.district || 'Pathanamthitta',
      state: customerDoc.state || 'Kerala',
      pincode: customerDoc.pincode || '689641',
      savedAddresses: customerDoc.savedAddresses || [],
      role: 'customer',
      location: `${customerDoc.district || 'Pathanamthitta'}, Kerala`
    };

    const token = generateToken({
      id: String(customerDoc._id),
      phone: customerDoc.phone,
      role: 'customer'
    });

    return res.status(201).json({
      success: true,
      isNewAccount: true,
      token,
      user: userObj
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration processing error' });
  }
});

module.exports = router;

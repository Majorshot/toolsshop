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
    const rawInput = String(req.body.identifier || req.body.phone || req.body.email || '').trim();
    const { purpose = 'login', name, email, phone } = req.body;
    const isEmailInput = rawInput.includes('@');

    // 1. Check if user entered store admin email configured in backend (.env) or registered staff member
    const configuredAdminEmail = (process.env.STORE_ADMIN_EMAIL || 'admin@variathupowertools.com').trim().toLowerCase();

    if (rawInput.toLowerCase() === configuredAdminEmail) {
      return res.json({
        success: true,
        requiresPassword: true,
        role: 'store',
        staffRole: 'owner',
        email: configuredAdminEmail,
        message: 'Store Administrator detected'
      });
    }

    if (isEmailInput) {
      const staffMember = await db.getStaffMemberByEmail(rawInput.toLowerCase());
      if (staffMember && staffMember.active && (staffMember.role === 'workshop_manager' || staffMember.role === 'manager')) {
        return res.json({
          success: true,
          requiresPassword: true,
          role: 'store',
          staffRole: staffMember.role,
          name: staffMember.name,
          email: staffMember.email,
          message: `${staffMember.role === 'workshop_manager' ? 'Workshop Manager' : 'Store Manager'} detected`
        });
      }
    }

    let cleanPhone = '';
    let customerDoc = null;
    let targetEmail = (email || '').trim();
    let customerName = (name || '').trim();

    if (purpose === 'register') {
      cleanPhone = String(phone || rawInput).replace(/[^0-9]/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number for registration.' });
      }
      if (!customerName || !customerName.trim()) {
        return res.status(400).json({ success: false, message: 'Full name is required for registration.' });
      }
      if (!targetEmail || !targetEmail.trim() || !targetEmail.includes('@') || !targetEmail.includes('.')) {
        return res.status(400).json({ success: false, message: 'A valid email address is required for registration.' });
      }

      // Check if already registered by phone or email
      const existingByPhone = await db.lookupCustomerByPhone(cleanPhone);
      if (existingByPhone) {
        return res.status(409).json({
          success: false,
          message: 'An account with this mobile number already exists. Please sign in instead.'
        });
      }
      const existingByEmail = await db.lookupCustomerByEmail(targetEmail);
      if (existingByEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in instead.'
        });
      }
    } else {
      // Login flow: support phone OR email lookup!
      if (isEmailInput) {
        targetEmail = rawInput.toLowerCase();
        customerDoc = await db.lookupCustomerByEmail(targetEmail);
        if (!customerDoc) {
          return res.status(404).json({
            success: false,
            message: 'No customer account found with this email. Please switch to "New Customer" to register.'
          });
        }
        cleanPhone = String(customerDoc.phone || '').replace(/[^0-9]/g, '').slice(-10);
        customerName = customerDoc.name || 'Valued Customer';
      } else {
        cleanPhone = rawInput.replace(/[^0-9]/g, '').slice(-10);
        if (!cleanPhone || cleanPhone.length !== 10) {
          return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number or registered email.' });
        }
        customerDoc = await db.lookupCustomerByPhone(cleanPhone);
        if (!customerDoc) {
          return res.status(404).json({
            success: false,
            message: 'No customer account found with this mobile number. Please switch to "New Customer" to register.'
          });
        }
        targetEmail = customerDoc.email || '';
        customerName = customerDoc.name || 'Valued Customer';
      }
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
        purpose,
        clientUrl: req.clientUrl || req.headers.origin
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
      resolvedPhone: cleanPhone,
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
    const { phone, identifier, email, otp } = req.body;
    let cleanPhone = String(phone || identifier || '').replace(/[^0-9]/g, '').slice(-10);

    // If identifier was an email, resolve to phone from customer profile
    if (!cleanPhone || cleanPhone.length !== 10) {
      const emailInput = String(identifier || email || phone || '').trim().toLowerCase();
      if (emailInput.includes('@')) {
        const cust = await db.lookupCustomerByEmail(emailInput);
        if (cust && cust.phone) {
          cleanPhone = String(cust.phone).replace(/[^0-9]/g, '').slice(-10);
        }
      }
    }

    const submittedOtp = String(otp || '').trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Valid mobile number or email required.' });
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
      emailService.sendWelcomeEmail(newCust, { clientUrl: req.clientUrl || req.headers.origin }).catch(err => {
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
  const { phone, identifier, email, purpose } = req.body;
  let cleanPhone = String(phone || identifier || '').replace(/[^0-9]/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) {
    const emailInput = String(identifier || email || phone || '').trim().toLowerCase();
    if (emailInput.includes('@')) {
      const cust = await db.lookupCustomerByEmail(emailInput);
      if (cust && cust.phone) {
        cleanPhone = String(cust.phone).replace(/[^0-9]/g, '').slice(-10);
      }
    }
  }

  const existing = otpStore.get(cleanPhone);

  const payload = {
    phone: cleanPhone,
    identifier: identifier || email || phone,
    purpose: purpose || existing?.purpose || 'login',
    name: existing?.registerData?.name,
    email: existing?.registerData?.email || email
  };

  req.body = payload;
  return router.handle({ ...req, url: '/send-otp', originalUrl: '/api/auth/send-otp' }, res);
});

// POST login endpoint - Secured Store Owner & Customer Authentication
router.post('/login', async (req, res) => {
  try {
    const { role, identifier, password } = req.body;

    if (role === 'store') {
      const configuredEmail = (process.env.STORE_ADMIN_EMAIL || 'admin@variathupowertools.com').trim().toLowerCase();
      const validPass = process.env.STORE_ADMIN_PASSWORD || 'admin123';
      const inputEmail = String(identifier || '').trim().toLowerCase();
      const inputPass = String(password || '');

      // 1. Check primary store owner credentials
      if (inputEmail === configuredEmail && safeCompare(inputPass, validPass)) {
        const token = generateToken({
          id: 'admin-01',
          name: 'Store Owner',
          email: configuredEmail,
          role: 'store',
          staffRole: 'owner'
        });

        return res.json({
          success: true,
          token,
          user: {
            id: 'admin-01',
            name: 'Store Owner',
            email: configuredEmail,
            role: 'store',
            staffRole: 'owner',
            shop: 'Variathu Power Tools, Kozhencherry'
          }
        });
      }

      // 2. Check registered staff credentials (Store Manager & Workshop Manager)
      const staffMember = await db.getStaffMemberByEmail(inputEmail);
      if (staffMember && staffMember.active && (staffMember.role === 'manager' || staffMember.role === 'workshop_manager')) {
        if (safeCompare(inputPass, staffMember.password)) {
          const token = generateToken({
            id: String(staffMember._id),
            name: staffMember.name,
            email: staffMember.email,
            role: 'store',
            staffRole: staffMember.role
          });

          return res.json({
            success: true,
            token,
            user: {
              id: String(staffMember._id),
              name: staffMember.name,
              email: staffMember.email,
              role: 'store',
              staffRole: staffMember.role,
              shop: 'Variathu Power Tools, Kozhencherry'
            }
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your staff email and password.'
      });
    } else {
      // Customer sign-in strictly requires OTP verification
      return res.status(403).json({
        success: false,
        message: 'Customer sign-in requires OTP verification. Please use /api/auth/send-otp and /api/auth/verify-otp.'
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
      if (req.user.staffRole === 'manager' || req.user.staffRole === 'workshop_manager') {
        const staffDoc = await db.getStaffMemberById(req.user.id);
        if (staffDoc && staffDoc.active) {
          return res.json({
            success: true,
            user: {
              id: String(staffDoc._id),
              name: staffDoc.name,
              email: staffDoc.email,
              role: 'store',
              staffRole: staffDoc.role,
              shop: 'Variathu Power Tools, Kozhencherry'
            }
          });
        }
      }

      const validEmail = process.env.STORE_ADMIN_EMAIL || 'admin@variathupowertools.com';
      return res.json({
        success: true,
        user: {
          id: 'admin-01',
          name: 'Store Owner',
          email: validEmail,
          role: 'store',
          staffRole: 'owner',
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
      // Privacy Protection: Mask customer name to prevent scraping and PII enumeration (e.g. "Midhun Mohan" -> "M••••• M••••")
      const rawName = String(customerDoc.name || 'Customer').trim();
      const maskedName = rawName
        .split(/\s+/)
        .map(word => {
          if (word.length <= 1) return word;
          if (word.length === 2) return word[0] + '•';
          return word[0] + '•'.repeat(Math.min(word.length - 1, 4));
        })
        .join(' ');

      return res.json({
        success: true,
        exists: true,
        name: maskedName,
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

// POST register endpoint - Block OTP-less direct registration
router.post('/register', async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Customer registration strictly requires OTP verification. Please use /api/auth/send-otp and /api/auth/verify-otp.'
  });
});

module.exports = router;

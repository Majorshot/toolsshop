const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const emailService = require('../services/emailService');

// POST login endpoint - Customer (lookup only) & Store Owner
router.post('/login', async (req, res) => {
  try {
    const { role, identifier, password } = req.body;

    if (role === 'store') {
      // Store Owner / Admin Login
      const validEmail = process.env.STORE_ADMIN_EMAIL || 'admin@variathupowertools.com';
      const validPass = process.env.STORE_ADMIN_PASSWORD || 'admin123';

      if ((identifier === validEmail && password === validPass) || password === validPass) {
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
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid store credentials. Please check your admin username and password.'
        });
      }
    } else {
      // Customer Login - LOOKUP ONLY (no auto-creation)
      const phone = (identifier || '').trim();
      if (!phone || phone.length < 7) {
        return res.status(400).json({ success: false, message: 'Please enter a valid mobile number.' });
      }

      const customerDoc = await db.lookupCustomerByPhone(phone);
      if (!customerDoc) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this mobile number. Please register first.'
        });
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
          role: 'customer',
          location: `${customerDoc.district || 'Pathanamthitta'}, Kerala`
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET check customer phone existence (Instant Blinkit/Zepto-style account check)
router.get('/check-phone/:phone', async (req, res) => {
  try {
    const rawPhone = req.params.phone;
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
    res.status(500).json({ success: false, exists: false, message: err.message });
  }
});

// POST register endpoint - Create new customer account
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ success: false, message: 'Valid mobile number is required.' });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = (email && email.trim().includes('@'))
      ? email.trim().toLowerCase()
      : `${cleanPhone.replace(/[^0-9]/g, '').slice(-10)}@customer.variathupowertools.com`;

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

    return res.status(201).json({
      success: true,
      isNewAccount: true,
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
        role: 'customer',
        location: `${customerDoc.district || 'Pathanamthitta'}, Kerala`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

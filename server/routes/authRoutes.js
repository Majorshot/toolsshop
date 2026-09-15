const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// POST login endpoint for both Customer and Store Owner
router.post('/login', async (req, res) => {
  try {
    const { role, identifier, password, name } = req.body;

    if (role === 'store') {
      // Store Owner / Admin Login (supports environment overrides for production)
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
      // Customer Login & Account Persistence (MongoDB Atlas)
      const customerDoc = await db.findOrCreateCustomer({
        identifier,
        phone: identifier,
        email: identifier.includes('@') ? identifier : (req.body.email || ''),
        name,
        address: req.body.address || '',
        district: req.body.district || 'Pathanamthitta',
        pincode: req.body.pincode || '689641'
      });

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

module.exports = router;

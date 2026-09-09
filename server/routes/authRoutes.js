const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// POST login endpoint for both Customer and Store Owner
router.post('/login', async (req, res) => {
  try {
    const { role, identifier, password, name } = req.body;

    if (role === 'store') {
      // Store Owner / Admin Login
      const validEmail = 'admin@variathupowertools.com';
      const validPass = 'admin123';

      if ((identifier === validEmail && password === validPass) || password === 'admin123') {
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
          message: 'Invalid store credentials. Use admin@variathupowertools.com / admin123'
        });
      }
    } else {
      // Customer Login
      const customerIdentifier = identifier ? identifier.trim() : '+91 98471 88990';
      const customerName = name ? name.trim() : (customerIdentifier.includes('98471') ? 'Raju Thomas' : 'Valued Customer');

      return res.json({
        success: true,
        user: {
          id: `cust-${Date.now().toString().slice(-4)}`,
          name: customerName,
          phone: customerIdentifier,
          email: customerIdentifier.includes('@') ? customerIdentifier : `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          role: 'customer',
          location: 'Kozhencherry, Pathanamthitta'
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

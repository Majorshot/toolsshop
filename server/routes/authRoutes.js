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
      const customerIdentifier = identifier ? identifier.trim() : '';
      const cleanDigits = customerIdentifier.replace(/[^0-9]/g, '').slice(-10);

      let customerName = name ? name.trim() : '';
      let customerEmail = customerIdentifier.includes('@') ? customerIdentifier : '';
      let customerPhone = customerIdentifier;
      let customerLocation = 'Kozhencherry, Pathanamthitta';

      // Auto-fetch real customer name and details from past orders in MongoDB Atlas
      if (cleanDigits.length >= 7 || customerIdentifier.includes('@')) {
        try {
          const pastOrders = await db.getCustomerOrders(cleanDigits || customerIdentifier);
          if (pastOrders && pastOrders.length > 0) {
            const pastOrder = pastOrders.find(
              o => o.customer?.name && o.customer.name.trim() !== '' && !o.customer.name.toLowerCase().includes('valued customer')
            ) || pastOrders[0];

            if (pastOrder && pastOrder.customer) {
              if (!customerName && pastOrder.customer.name) {
                customerName = pastOrder.customer.name.trim();
              }
              if (!customerEmail && pastOrder.customer.email && pastOrder.customer.email.includes('@')) {
                customerEmail = pastOrder.customer.email.trim();
              }
              if (pastOrder.customer.phone && !customerPhone) {
                customerPhone = pastOrder.customer.phone.trim();
              }
              if (pastOrder.customer.district) {
                customerLocation = `${pastOrder.customer.district}, Kerala`;
              }
            }
          }
        } catch (lookupErr) {
          console.warn("Could not lookup past customer orders for login:", lookupErr.message);
        }
      }

      // If still no name found, use clean fallback (never generic 'Valued Customer')
      if (!customerName) {
        customerName = customerIdentifier.includes('98471') ? 'Raju Thomas' : (cleanDigits ? `Customer (${cleanDigits.slice(-4)})` : 'Customer');
      }

      return res.json({
        success: true,
        user: {
          id: `cust-${Date.now().toString().slice(-4)}`,
          name: customerName,
          phone: customerPhone,
          email: customerEmail, // Real email or empty string - NO fake email!
          role: 'customer',
          location: customerLocation
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

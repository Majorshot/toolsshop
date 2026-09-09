const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../utils/db');

// Initialize Razorpay Instance with user's keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TZQUSp5JtcBjMs',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dhYp7neRQNqygARxN2oM6pl1',
});

// GET Razorpay Public Key ID
router.get('/config', (req, res) => {
  res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TZQUSp5JtcBjMs'
  });
});

// POST create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now().toString().slice(-6)}`,
      notes: notes || {
        store: "Variathu Power Tools",
        location: "Kozhencherry, Pathanamthitta, Kerala"
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TZQUSp5JtcBjMs'
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({
      success: false,
      message: err.error ? err.error.description : err.message
    });
  }
});

// POST verify Razorpay signature and create confirmed order
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderPayload
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay verification parameters"
      });
    }

    // Compute expected cryptographic HMAC-SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dhYp7neRQNqygARxN2oM6pl1';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Cryptographic signature mismatch. Payment verification failed."
      });
    }

    // Payment is 100% verified authentic! Create order in DB with PAID status
    const confirmedOrder = await db.createOrder({
      ...orderPayload,
      paymentMethod: "RAZORPAY_UPI",
      paymentStatus: "PAID",
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    });

    res.json({
      success: true,
      message: "Payment verified successfully. Order confirmed!",
      data: confirmedOrder
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;

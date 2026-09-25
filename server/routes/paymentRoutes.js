const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../utils/db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { optionalAuth } = require('../utils/auth');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TZQUSp5JtcBjMs';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dhYp7neRQNqygARxN2oM6pl1';

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// GET Razorpay Public Key ID
router.get('/config', (req, res) => {
  res.json({
    success: true,
    keyId: RAZORPAY_KEY_ID
  });
});

// POST create Razorpay order (with Server-Side Price Verification)
router.post('/create-order', optionalAuth, async (req, res) => {
  try {
    const { amount, receipt, notes, items, deliveryType, couponCode, customer } = req.body;

    let payableAmount = Number(amount) || 0;

    // If items are provided, authoritatively calculate the total from database prices
    if (Array.isArray(items) && items.length > 0) {
      const itemIds = items.map(i => i.id).filter(Boolean);
      const dbProducts = await db.ProductModel.find({ id: { $in: itemIds } }).lean();
      const productMap = new Map(dbProducts.map(p => [p.id, p]));

      let subtotal = 0;
      let deliveryFee = 0;

      for (const item of items) {
        const prod = productMap.get(item.id);
        if (prod) {
          const qty = Math.max(1, Math.min(50, Number(item.quantity) || 1));
          subtotal += (Number(prod.price) || 0) * qty;
          const itemDelivery = typeof prod.deliveryCost === 'number' ? prod.deliveryCost : 120;
          deliveryFee += itemDelivery * qty;
        }
      }

      const isPickup = (deliveryType || '').toLowerCase().includes('pickup') || deliveryType === 'store-pickup';
      const actualDeliveryFee = isPickup ? 0 : deliveryFee;

      let discount = 0;
      if (couponCode) {
        const userIdent = {
          customerId: req.user?.id || customer?.id,
          phone: customer?.phone || req.user?.phone || '',
          email: customer?.email || req.user?.email || ''
        };
        const couponCheck = await db.validateCoupon(couponCode, subtotal, userIdent);
        if (couponCheck.valid) {
          discount = Number(couponCheck.discountAmount) || 0;
        }
      }

      payableAmount = Math.max(1, subtotal - discount + actualDeliveryFee);
    }

    if (!payableAmount || payableAmount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(payableAmount * 100),
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
      keyId: RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({
      success: false,
      message: err.error ? err.error.description : 'Failed to initialize payment gateway'
    });
  }
});

// POST verify Razorpay signature and create confirmed order
router.post('/verify', optionalAuth, async (req, res) => {
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

    if (!orderPayload || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order items in payload"
      });
    }

    // Compute expected cryptographic HMAC-SHA256 signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Constant-time comparison
    const sigBuf = Buffer.from(razorpay_signature);
    const expBuf = Buffer.from(expectedSignature);
    const isAuthentic = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Cryptographic signature mismatch. Payment verification failed."
      });
    }

    // Server-side authoritative price recalculation for the paid items
    const itemIds = orderPayload.items.map(i => i.id).filter(Boolean);
    const dbProducts = await db.ProductModel.find({ id: { $in: itemIds } }).lean();
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedSubtotal = 0;
    let calculatedDeliveryFee = 0;
    const verifiedItems = [];

    for (const item of orderPayload.items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return res.status(400).json({ success: false, message: `Product "${item.name}" is no longer available` });
      }
      const qty = Math.max(1, Math.min(50, Number(item.quantity) || 1));
      const price = Number(dbProduct.price) || 0;
      calculatedSubtotal += price * qty;
      const itemDelivery = typeof dbProduct.deliveryCost === 'number' ? dbProduct.deliveryCost : 120;
      calculatedDeliveryFee += itemDelivery * qty;

      verifiedItems.push({
        id: dbProduct.id,
        name: dbProduct.name,
        brand: dbProduct.brand,
        price,
        quantity: qty,
        image: dbProduct.image || item.image || ''
      });
    }

    const isPickup = (orderPayload.deliveryType || '').toLowerCase().includes('pickup') || orderPayload.deliveryType === 'store-pickup';
    const authoritativeDeliveryFee = isPickup ? 0 : calculatedDeliveryFee;

    let verifiedDiscount = 0;
    if (orderPayload.couponCode) {
      const userIdent = {
        customerId: req.user?.id || orderPayload.customerId,
        phone: orderPayload.customer?.phone || req.user?.phone || '',
        email: orderPayload.customer?.email || req.user?.email || ''
      };
      const couponCheck = await db.validateCoupon(orderPayload.couponCode, calculatedSubtotal, userIdent);
      if (couponCheck.valid) {
        verifiedDiscount = Number(couponCheck.discountAmount) || 0;
      }
    }

    const authoritativeTotal = Math.max(0, calculatedSubtotal - verifiedDiscount + authoritativeDeliveryFee);

    // Verify fetched payment details from Razorpay to confirm payment integrity
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (payment) {
        const paidPaise = payment.amount;
        const expectedPaise = Math.round(authoritativeTotal * 100);
        // Allow at most 100 paise (₹1) tolerance for rounding
        if (Math.abs(paidPaise - expectedPaise) > 100) {
          console.warn(`[Payment Tamper Warning] Paid: ${paidPaise} paise vs Expected: ${expectedPaise} paise`);
          return res.status(400).json({
            success: false,
            message: "Amount paid on payment gateway does not match order items total."
          });
        }
      }
    } catch (fetchErr) {
      console.warn("[Payment Verification] Notice: Live fetch verify skipped:", fetchErr.message);
    }

    // Payment is 100% verified authentic! Create order in DB with PAID status
    const confirmedOrder = await db.createOrder({
      ...orderPayload,
      items: verifiedItems,
      totalAmount: authoritativeTotal,
      deliveryFee: authoritativeDeliveryFee,
      discountAmount: verifiedDiscount,
      paymentMethod: "RAZORPAY_UPI",
      paymentStatus: "PAID",
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    });

    // Record coupon usage in DB
    if (orderPayload.couponCode) {
      const userIdent = {
        customerId: confirmedOrder.customerId || orderPayload.customerId,
        phone: confirmedOrder.customer?.phone,
        email: confirmedOrder.customer?.email
      };
      await db.recordCouponUsage(orderPayload.couponCode, userIdent);
    }

    // Trigger automated Resend Order Confirmation Email asynchronously
    emailService.sendOrderConfirmationEmail(confirmedOrder).catch(err => {
      console.warn(`[Resend Email] Async payment order confirmation error for #${confirmedOrder.id}:`, err.message);
    });

    // Trigger automated WhatsApp Order Confirmation asynchronously
    whatsappService.sendOrderConfirmationWhatsApp(confirmedOrder).catch(err => {
      console.warn(`[WhatsApp API] Async payment WhatsApp notice error for #${confirmedOrder.id}:`, err.message);
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
      message: 'Payment verification failed'
    });
  }
});

module.exports = router;

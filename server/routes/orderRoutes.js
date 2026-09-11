const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET all orders (Admin / Store Owner)
router.get('/', async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET customer orders by phone/email/name
router.get('/customer/:identifier', async (req, res) => {
  try {
    const orders = await db.getCustomerOrders(req.params.identifier);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update order status (Store Owner)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, courierPartner, awb } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    const updated = await db.updateOrderStatus(req.params.id, status, { courierPartner, awb });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, message: "Order status updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST place new order
router.post('/', async (req, res) => {
  try {
    const { customer, items, totalAmount, deliveryType, paymentMethod, couponCode, discountAmount } = req.body;
    if (!customer || !items || !items.length) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    // Anti-Abuse Check: If coupon is used, validate against customer phone & global caps
    if (couponCode) {
      const couponCheck = await db.validateCoupon(couponCode, totalAmount, customer?.phone);
      if (!couponCheck.valid) {
        return res.status(400).json({ success: false, message: couponCheck.message });
      }
    }

    const order = await db.createOrder({
      customer,
      items,
      totalAmount,
      deliveryType: deliveryType || 'store-pickup',
      paymentMethod: paymentMethod || 'cod',
      couponCode: couponCode || null,
      discountAmount: Number(discountAmount) || 0
    });

    // Record coupon usage in DB and update customer phone usage history
    if (couponCode) {
      await db.recordCouponUsage(couponCode, customer?.phone);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully at Variathu Power Tools",
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET live courier or pickup tracking details
router.get('/:id/tracking', async (req, res) => {
  try {
    const tracking = await db.getOrderTracking(req.params.id);
    if (!tracking) {
      return res.status(404).json({ success: false, message: "Tracking info not found for this order" });
    }
    res.json({ success: true, data: tracking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST verify 4-digit pickup OTP by store counter staff
router.post('/:id/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "4-digit pickup OTP is required" });
    }
    const result = await db.verifyPickupOtp(req.params.id, otp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST mark order as PAID (Webhook / Instant Payment Simulator)
router.post('/:id/pay', async (req, res) => {
  try {
    const { transactionId, method } = req.body;
    const order = await db.processOrderPayment(req.params.id, { transactionId, method });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({
      success: true,
      message: "Payment captured successfully. Order marked as PAID.",
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST cancel order with automatic refund (Customer or Store Owner)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason, cancelledBy } = req.body || {};
    const result = await db.cancelOrder(req.params.id, { reason, cancelledBy });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

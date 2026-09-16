const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

// GET all orders (Admin / Store Owner)
router.get('/', async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET customer orders by phone/email/name/customerId
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

    const sLower = (status || '').toLowerCase();

    // Trigger dispatched/courier email & WhatsApp when status changes to dispatched or shipped
    if (sLower.includes('dispatch') || sLower.includes('shipp') || sLower.includes('in-transit')) {
      emailService.sendOrderDispatchedEmail(updated, courierPartner, awb).catch(err => {
        console.warn(`[Resend Email] Async dispatch email error for order #${updated.id}:`, err.message);
      });
      whatsappService.sendOrderDispatchedWhatsApp(updated, courierPartner, awb).catch(err => {
        console.warn(`[WhatsApp API] Async dispatch WhatsApp error for order #${updated.id}:`, err.message);
      });
    }

    // Trigger ready for pickup WhatsApp when status changes to ready for pickup
    if (sLower.includes('ready') || sLower.includes('pickup')) {
      whatsappService.sendPickupReadyWhatsApp(updated).catch(err => {
        console.warn(`[WhatsApp API] Async pickup ready WhatsApp error for order #${updated.id}:`, err.message);
      });
    }

    // Trigger completed / delivered email when status changes to delivered or completed
    if (sLower.includes('deliver') || sLower.includes('complet')) {
      emailService.sendOrderCompletedEmail(updated).catch(err => {
        console.warn(`[Resend Email] Async completed/delivered email error for order #${updated.id}:`, err.message);
      });
    }

    // Trigger cancelled email & WhatsApp when store owner cancels directly via status update
    if (sLower.includes('cancel')) {
      emailService.sendOrderCancelledEmail(updated, 'Cancelled by store', 'store').catch(err => {
        console.warn(`[Resend Email] Async cancelled email error for order #${updated.id}:`, err.message);
      });
      whatsappService.sendOrderCancelledWhatsApp(updated, 'Cancelled by store').catch(err => {
        console.warn(`[WhatsApp API] Async cancelled WhatsApp error for order #${updated.id}:`, err.message);
      });
    }

    res.json({ success: true, message: "Order status updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST place new order (Account-Based Checkout Flow)
router.post('/', async (req, res) => {
  try {
    const { customer, customerId, items, totalAmount, deliveryType, paymentMethod, couponCode, discountAmount } = req.body;
    if (!customer || !items || !items.length) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    const userIdent = {
      customerId: customerId || customer?.id || customer?._id,
      phone: customer?.phone,
      email: customer?.email
    };

    // Anti-Abuse Check: If coupon is used, validate against account ID, email, phone & global caps
    if (couponCode) {
      const couponCheck = await db.validateCoupon(couponCode, totalAmount, userIdent);
      if (!couponCheck.valid) {
        return res.status(400).json({ success: false, message: couponCheck.message });
      }
    }

    const order = await db.createOrder({
      customer,
      customerId: userIdent.customerId || null,
      items,
      totalAmount,
      deliveryType: deliveryType || 'store-pickup',
      paymentMethod: paymentMethod || 'cod',
      couponCode: couponCode || null,
      discountAmount: Number(discountAmount) || 0
    });

    // Record coupon usage in DB with account ID, email, and phone
    if (couponCode) {
      await db.recordCouponUsage(couponCode, userIdent);
    }

    // Trigger automated Resend Order Confirmation Email asynchronously
    emailService.sendOrderConfirmationEmail(order).catch(err => {
      console.warn(`[Resend Email] Async dispatch notice for order #${order.id}:`, err.message);
    });

    // Trigger automated WhatsApp Order Confirmation asynchronously
    whatsappService.sendOrderConfirmationWhatsApp(order).catch(err => {
      console.warn(`[WhatsApp API] Async order confirmation notice for order #${order.id}:`, err.message);
    });

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

    // Trigger order cancelled email & WhatsApp (result.order or result.data)
    const orderData = result.order || result.data;
    if (orderData) {
      emailService.sendOrderCancelledEmail(orderData, reason, cancelledBy).catch(err => {
        console.warn(`[Resend Email] Async cancelled email error:`, err.message);
      });
      whatsappService.sendOrderCancelledWhatsApp(orderData, reason).catch(err => {
        console.warn(`[WhatsApp API] Async cancelled WhatsApp error:`, err.message);
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST request cancellation for dispatched orders (Customer)
router.post('/:id/request-cancel', async (req, res) => {
  try {
    const { reason } = req.body || {};
    const result = await db.requestCancellation(req.params.id, { reason });
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Trigger cancellation request email (result.order or result.data)
    const orderData = result.order || result.data;
    if (orderData) {
      emailService.sendCancellationRequestEmail(orderData, reason).catch(err => {
        console.warn(`[Resend Email] Async cancellation request email error:`, err.message);
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST reject cancellation request (Store Owner)
router.post('/:id/reject-cancel', async (req, res) => {
  try {
    const result = await db.rejectCancellationRequest(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST on-demand WhatsApp notification trigger (Store Owner)
router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const { messageType } = req.body || {};
    let result;
    if (messageType === 'dispatched') {
      result = await whatsappService.sendOrderDispatchedWhatsApp(order, order.courierPartner, order.awb);
    } else if (messageType === 'pickup') {
      result = await whatsappService.sendPickupReadyWhatsApp(order);
    } else if (messageType === 'cancelled') {
      result = await whatsappService.sendOrderCancelledWhatsApp(order, order.cancellationReason || 'Customer requested');
    } else {
      result = await whatsappService.sendOrderConfirmationWhatsApp(order);
    }
    res.json({ success: true, message: "WhatsApp message dispatched successfully", result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


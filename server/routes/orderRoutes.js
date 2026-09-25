const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const db = require('../utils/db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { requireStoreOwner, requireAuth, optionalAuth } = require('../utils/auth');

// GET all orders (Strict Admin / Store Owner)
router.get('/', requireStoreOwner, async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
  }
});

// GET customer orders by phone or customerId (Admin or Authenticated Customer)
router.get('/customer/:identifier', optionalAuth, async (req, res) => {
  try {
    const rawIdentifier = String(req.params.identifier || '').trim();
    const cleanDigits = rawIdentifier.replace(/[^0-9]/g, '').slice(-10);
    const isObjectId = mongoose.isValidObjectId(rawIdentifier);

    // Require authentication
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required to view orders.' });
    }

    // If not store owner, ensure caller only queries their own orders
    if (req.user.role !== 'store') {
      const userPhone = String(req.user.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const userId = String(req.user.id || '');

      const isMatchingPhone = cleanDigits.length === 10 && userPhone === cleanDigits;
      const isMatchingId = isObjectId && userId === rawIdentifier;

      if (!isMatchingPhone && !isMatchingId) {
        return res.status(403).json({ success: false, message: 'Access denied to these orders.' });
      }
    }

    // Query safely by both phone and customerId so all customer orders are retrieved
    const queryConditions = [];
    if (cleanDigits.length === 10) {
      queryConditions.push({ 'customer.phone': { $regex: cleanDigits } });
    }
    if (isObjectId) {
      queryConditions.push({ customerId: rawIdentifier });
    }
    if (req.user && req.user.phone) {
      const uPhone = String(req.user.phone).replace(/[^0-9]/g, '').slice(-10);
      if (uPhone.length === 10 && !queryConditions.some(c => c['customer.phone'])) {
        queryConditions.push({ 'customer.phone': { $regex: uPhone } });
      }
    }
    if (req.user && req.user.id && mongoose.isValidObjectId(req.user.id)) {
      if (!queryConditions.some(c => c.customerId && c.customerId.toString() === req.user.id)) {
        queryConditions.push({ customerId: req.user.id });
      }
    }

    const orders = queryConditions.length > 0
      ? await db.OrderModel.find({ $or: queryConditions }).sort({ createdAt: -1 }).lean()
      : [];

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve customer orders' });
  }
});

// PUT update order status (Strict Admin / Store Owner)
router.put('/:id/status', requireStoreOwner, async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// POST place new order (Account-Based Checkout Flow with Server-Side Price Calculation)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { customer, customerId, items, deliveryType, paymentMethod, couponCode } = req.body;
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order items" });
    }

    const cleanCustomerPhone = String(customer.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (!cleanCustomerPhone || cleanCustomerPhone.length !== 10) {
      return res.status(400).json({ success: false, message: "A valid 10-digit mobile number is required" });
    }

    const userIdent = {
      customerId: (req.user && req.user.role === 'customer' ? req.user.id : customerId) || customer?.id || customer?._id,
      phone: cleanCustomerPhone,
      email: (customer?.email || '').trim()
    };

    // Server-side authoritative price verification against ProductModel
    const itemIds = items.map(i => i.id).filter(Boolean);
    const dbProducts = await db.ProductModel.find({ id: { $in: itemIds } }).lean();
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedSubtotal = 0;
    let calculatedDeliveryFee = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name || item.id}" is currently unavailable.`
        });
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
        price: price,
        quantity: qty,
        image: dbProduct.image || item.image || ''
      });
    }

    const isStorePickup = (deliveryType || '').toLowerCase().includes('pickup') || deliveryType === 'store-pickup';
    const authoritativeDeliveryFee = isStorePickup ? 0 : calculatedDeliveryFee;

    // Validate coupon against verified subtotal
    let verifiedDiscount = 0;
    if (couponCode) {
      const couponCheck = await db.validateCoupon(couponCode, calculatedSubtotal, userIdent);
      if (!couponCheck.valid) {
        return res.status(400).json({ success: false, message: couponCheck.message });
      }
      verifiedDiscount = Number(couponCheck.discountAmount) || 0;
    }

    const authoritativeTotal = Math.max(0, calculatedSubtotal - verifiedDiscount + authoritativeDeliveryFee);

    // Prevent client from setting paymentStatus to PAID on normal COD/Pickup orders
    const normalizedMethod = (paymentMethod || 'COD').toUpperCase();
    const isCashOrPickup = normalizedMethod === 'COD' || normalizedMethod === 'PAY_AT_STORE';

    const order = await db.createOrder({
      customer: {
        ...customer,
        phone: cleanCustomerPhone
      },
      customerId: userIdent.customerId || null,
      items: verifiedItems,
      totalAmount: authoritativeTotal,
      deliveryType: isStorePickup ? 'store-pickup' : 'kerala-courier',
      deliveryFee: authoritativeDeliveryFee,
      paymentMethod: isCashOrPickup ? normalizedMethod : 'PENDING_ONLINE',
      paymentStatus: 'PENDING',
      transactionId: null,
      couponCode: couponCode || null,
      discountAmount: verifiedDiscount
    });

    // Record coupon usage in DB with account ID, email, and phone
    if (couponCode) {
      await db.recordCouponUsage(couponCode, userIdent);
    }

    // Clear customer cloud cart in DB after successful order placement
    if (cleanCustomerPhone) {
      db.CustomerModel.updateOne(
        { phone: cleanCustomerPhone },
        { $set: { cart: [] } }
      ).catch(() => {});
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
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

// GET live courier or pickup tracking details (Public)
router.get('/:id/tracking', async (req, res) => {
  try {
    const tracking = await db.getOrderTracking(req.params.id);
    if (!tracking) {
      return res.status(404).json({ success: false, message: "Tracking info not found for this order" });
    }
    res.json({ success: true, data: tracking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve tracking info' });
  }
});

// POST verify 4-digit pickup OTP by store counter staff (Strict Admin / Store Owner)
router.post('/:id/verify-otp', requireStoreOwner, async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Pickup verification error' });
  }
});

// POST mark order as PAID (Strict Admin / Store Owner)
router.post('/:id/pay', requireStoreOwner, async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Failed to process payment status' });
  }
});

// POST cancel order with automatic refund (Customer Owner or Store Owner)
router.post('/:id/cancel', optionalAuth, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Authorization: User must be store owner or the customer who placed the order
    if (req.user) {
      const isStoreOwner = req.user.role === 'store';
      const userPhone = String(req.user.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const orderPhone = String(order.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const isOwner = String(req.user.id || '') === String(order.customerId) || (userPhone && userPhone === orderPhone);

      if (!isStoreOwner && !isOwner) {
        return res.status(403).json({ success: false, message: "You are not authorized to cancel this order." });
      }
    }

    const { reason, cancelledBy } = req.body || {};
    const result = await db.cancelOrder(req.params.id, { reason, cancelledBy });
    if (!result.success) {
      return res.status(400).json(result);
    }

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
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

// POST request cancellation for dispatched orders (Customer or Store Owner)
router.post('/:id/request-cancel', optionalAuth, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (req.user && req.user.role !== 'store') {
      const userPhone = String(req.user.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const orderPhone = String(order.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const isOwner = String(req.user.id || '') === String(order.customerId) || (userPhone && userPhone === orderPhone);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: "You are not authorized to request cancellation for this order." });
      }
    }

    const { reason } = req.body || {};
    const result = await db.requestCancellation(req.params.id, { reason });
    if (!result.success) {
      return res.status(400).json(result);
    }

    const orderData = result.order || result.data;
    if (orderData) {
      emailService.sendCancellationRequestEmail(orderData, reason).catch(err => {
        console.warn(`[Resend Email] Async cancellation request email error:`, err.message);
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit cancellation request' });
  }
});

// POST reject cancellation request (Strict Admin / Store Owner)
router.post('/:id/reject-cancel', requireStoreOwner, async (req, res) => {
  try {
    const result = await db.rejectCancellationRequest(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject cancellation' });
  }
});

// POST on-demand WhatsApp notification trigger (Strict Admin / Store Owner)
router.post('/:id/send-whatsapp', requireStoreOwner, async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
});

module.exports = router;

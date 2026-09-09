const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /api/coupons - List all coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coupons - Create coupon
router.post('/', async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, active, usageLimitPerUser, maxTotalUses } = req.body;
    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Code and discount value are required' });
    }
    const coupon = await db.createCoupon({
      code,
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      usageLimitPerUser: Number(usageLimitPerUser) || 0,
      maxTotalUses: Number(maxTotalUses) || 0,
      active: active !== undefined ? Boolean(active) : true
    });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/coupons/validate - Validate coupon against cart total & phone eligibility
router.post('/validate', async (req, res) => {
  try {
    const code = req.body.code;
    const subtotal = req.body.subtotal ?? req.body.cartSubtotal ?? 0;
    const phone = req.body.phone || '';
    const result = await db.validateCoupon(code, Number(subtotal) || 0, phone);
    if (!result.valid) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ valid: false, message: err.message });
  }
});

// PUT /api/coupons/:id - Update coupon
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.updateCoupon(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, coupon: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/coupons/:id - Delete coupon
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteCoupon(req.params.id);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

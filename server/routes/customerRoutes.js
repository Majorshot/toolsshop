const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET all customers with search, filter, and pagination
router.get('/', async (req, res) => {
  try {
    const { search, sortBy, page, limit } = req.query;
    const result = await db.getCustomers({ search, sortBy, page, limit });
    res.json({
      success: true,
      count: result.customers.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      data: result.customers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single customer by ID or phone with purchase history
router.get('/:id', async (req, res) => {
  try {
    const customer = await db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update customer profile
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.updateCustomer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, message: "Customer updated successfully", data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST create customer manually
router.post('/', async (req, res) => {
  try {
    const created = await db.createCustomer(req.body);
    res.status(201).json({ success: true, message: "Customer registered successfully", data: created });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;

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

// POST add new delivery address (Flipkart style)
router.post('/:id/addresses', async (req, res) => {
  try {
    const {
      name,
      phone,
      pincode,
      locality,
      address,
      city,
      district,
      state,
      landmark,
      alternatePhone,
      addressType,
      isDefault
    } = req.body;

    if (!pincode || !address) {
      return res.status(400).json({ success: false, message: "Pincode and street address are required" });
    }

    const newAddress = {
      id: 'addr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name || '',
      phone: phone || '',
      pincode: String(pincode).trim(),
      locality: locality || '',
      address: address || '',
      city: city || district || 'Pathanamthitta',
      district: district || 'Pathanamthitta',
      state: state || 'Kerala',
      landmark: landmark || '',
      alternatePhone: alternatePhone || '',
      addressType: addressType || 'HOME',
      isDefault: !!isDefault
    };

    // Update customer: set primary address fields and append to savedAddresses
    const updated = await db.updateCustomer(req.params.id, {
      $set: {
        address: newAddress.address,
        district: newAddress.district,
        state: newAddress.state,
        pincode: newAddress.pincode,
        landmark: newAddress.landmark
      },
      $push: {
        savedAddresses: newAddress
      }
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({
      success: true,
      message: "Address saved successfully",
      data: updated,
      address: newAddress
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE remove a saved address
router.delete('/:id/addresses/:addressId', async (req, res) => {
  try {
    const updated = await db.updateCustomer(req.params.id, {
      $pull: {
        savedAddresses: { id: req.params.addressId }
      }
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, message: "Address deleted successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

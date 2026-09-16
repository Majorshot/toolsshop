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

// PUT update an existing saved address
router.put('/:id/addresses/:addressId', async (req, res) => {
  try {
    const { name, phone, pincode, locality, address, city, district, state, landmark, alternatePhone, addressType, isDefault } = req.body;
    const mongoose = require('mongoose');
    const customer = await db.CustomerModel.findOne(
      mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { phone: req.params.id.replace(/[^0-9]/g, '').slice(-10) }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!customer.savedAddresses) customer.savedAddresses = [];
    const addrIdx = customer.savedAddresses.findIndex(
      a => (a.id === req.params.addressId || a._id?.toString() === req.params.addressId)
    );

    if (addrIdx === -1) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (isDefault) {
      customer.savedAddresses.forEach(a => { a.isDefault = false; });
    }

    const current = customer.savedAddresses[addrIdx];
    const updated = {
      id: current.id || req.params.addressId,
      name: name !== undefined ? name : current.name,
      phone: phone !== undefined ? phone : current.phone,
      pincode: pincode !== undefined ? pincode : current.pincode,
      locality: locality !== undefined ? locality : current.locality,
      address: address !== undefined ? address : current.address,
      city: city !== undefined ? city : current.city,
      district: district !== undefined ? district : current.district,
      state: state !== undefined ? state : current.state,
      landmark: landmark !== undefined ? landmark : current.landmark,
      alternatePhone: alternatePhone !== undefined ? alternatePhone : current.alternatePhone,
      addressType: addressType || current.addressType || 'HOME',
      isDefault: isDefault !== undefined ? Boolean(isDefault) : Boolean(current.isDefault)
    };

    customer.savedAddresses[addrIdx] = updated;
    customer.markModified('savedAddresses');

    if (updated.isDefault || customer.savedAddresses.length === 1) {
      customer.address = updated.address;
      customer.district = updated.district;
      customer.state = updated.state;
      customer.pincode = updated.pincode;
      customer.landmark = updated.landmark;
    }

    await customer.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      data: customer.toObject(),
      address: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT mark address as default
router.put('/:id/addresses/:addressId/default', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const customer = await db.CustomerModel.findOne(
      mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { phone: req.params.id.replace(/[^0-9]/g, '').slice(-10) }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!customer.savedAddresses || customer.savedAddresses.length === 0) {
      return res.status(404).json({ success: false, message: "No saved addresses found" });
    }

    let selected = null;
    customer.savedAddresses.forEach(a => {
      if (a.id === req.params.addressId || a._id?.toString() === req.params.addressId) {
        a.isDefault = true;
        selected = a;
      } else {
        a.isDefault = false;
      }
    });

    if (!selected) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    customer.address = selected.address;
    customer.district = selected.district;
    customer.state = selected.state;
    customer.pincode = selected.pincode;
    customer.landmark = selected.landmark;

    customer.markModified('savedAddresses');
    await customer.save();

    res.json({
      success: true,
      message: "Default address updated successfully",
      data: customer.toObject()
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

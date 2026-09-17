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
// POST add new delivery address (or update existing if matching address)
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

    const mongoose = require('mongoose');
    const customer = await db.CustomerModel.findOne(
      mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { phone: req.params.id.replace(/[^0-9]/g, '').slice(-10) }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!customer.savedAddresses) customer.savedAddresses = [];

    const normAddress = address.trim();
    const normPincode = String(pincode).trim();
    const normAddressType = (addressType || 'HOME').toUpperCase() === 'WORK' ? 'WORK' : 'HOME';

    // Prevent duplicate: check if an address with the same street address & pincode already exists
    const existingIdx = customer.savedAddresses.findIndex(
      a => a.address && a.address.trim().toLowerCase() === normAddress.toLowerCase() &&
           String(a.pincode).trim() === normPincode
    );

    let savedAddress;

    if (existingIdx !== -1) {
      // Update the existing address in place so it never duplicates
      const curr = customer.savedAddresses[existingIdx];
      curr.name = name ? name.trim() : curr.name;
      curr.phone = phone ? phone.trim() : curr.phone;
      curr.locality = locality !== undefined ? locality.trim() : curr.locality;
      curr.city = city !== undefined ? city.trim() : curr.city;
      curr.district = district !== undefined ? district.trim() : curr.district;
      curr.state = state !== undefined ? state.trim() : curr.state;
      curr.landmark = landmark !== undefined ? landmark.trim() : curr.landmark;
      curr.alternatePhone = alternatePhone !== undefined ? alternatePhone.trim() : curr.alternatePhone;
      curr.addressType = normAddressType;
      if (isDefault) {
        customer.savedAddresses.forEach(a => { a.isDefault = false; });
        curr.isDefault = true;
      }
      savedAddress = curr;
    } else {
      if (isDefault || customer.savedAddresses.length === 0) {
        customer.savedAddresses.forEach(a => { a.isDefault = false; });
      }
      const newAddress = {
        id: 'addr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name ? name.trim() : (customer.name || ''),
        phone: phone ? phone.trim() : (customer.phone || ''),
        pincode: normPincode,
        locality: locality ? locality.trim() : '',
        address: normAddress,
        city: city ? city.trim() : (district ? district.trim() : 'Pathanamthitta'),
        district: district ? district.trim() : 'Pathanamthitta',
        state: state ? state.trim() : 'Kerala',
        landmark: landmark ? landmark.trim() : '',
        alternatePhone: alternatePhone ? alternatePhone.trim() : '',
        addressType: normAddressType,
        isDefault: Boolean(isDefault) || customer.savedAddresses.length === 0
      };
      customer.savedAddresses.push(newAddress);
      savedAddress = newAddress;
    }

    if (savedAddress.isDefault || customer.savedAddresses.length === 1) {
      customer.address = savedAddress.address;
      customer.locality = savedAddress.locality;
      customer.district = savedAddress.district;
      customer.state = savedAddress.state;
      customer.pincode = savedAddress.pincode;
      customer.landmark = savedAddress.landmark;
      customer.addressType = normAddressType;
    }

    customer.markModified('savedAddresses');
    await customer.save();

    const custObj = customer.toObject();
    custObj.id = customer._id;

    res.json({
      success: true,
      message: "Address saved successfully",
      data: custObj,
      address: savedAddress
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

    const normAddressType = (addressType || 'HOME').toUpperCase() === 'WORK' ? 'WORK' : 'HOME';

    // Find target address by id or _id
    let addrIdx = customer.savedAddresses.findIndex(
      a => (a.id === req.params.addressId || a._id?.toString() === req.params.addressId)
    );

    // If addressId is a placeholder ('default-acc-addr', 'default-1') or only 1 address exists
    if (addrIdx === -1 && (req.params.addressId.startsWith('default') || customer.savedAddresses.length <= 1)) {
      if (customer.savedAddresses.length > 0) {
        addrIdx = 0;
      }
    }

    let updated;

    if (addrIdx === -1) {
      // No address exists yet: insert this updated address as the first/default address
      updated = {
        id: 'addr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: (name || customer.name || '').trim(),
        phone: (phone || customer.phone || '').trim(),
        pincode: pincode ? String(pincode).trim() : customer.pincode,
        locality: (locality || '').trim(),
        address: (address || customer.address || '').trim(),
        city: (city || district || 'Pathanamthitta').trim(),
        district: (district || customer.district || 'Pathanamthitta').trim(),
        state: (state || customer.state || 'Kerala').trim(),
        landmark: (landmark || customer.landmark || '').trim(),
        alternatePhone: (alternatePhone || '').trim(),
        addressType: normAddressType,
        isDefault: true
      };
      customer.savedAddresses.push(updated);
    } else {
      if (isDefault) {
        customer.savedAddresses.forEach(a => { a.isDefault = false; });
      }

      const current = customer.savedAddresses[addrIdx];
      updated = {
        id: current.id || req.params.addressId,
        _id: current._id,
        name: name !== undefined ? name.trim() : (current.name || ''),
        phone: phone !== undefined ? phone.trim() : (current.phone || ''),
        pincode: pincode !== undefined ? String(pincode).trim() : (current.pincode || ''),
        locality: locality !== undefined ? locality.trim() : (current.locality || ''),
        address: address !== undefined ? address.trim() : (current.address || ''),
        city: city !== undefined ? city.trim() : (current.city || 'Pathanamthitta'),
        district: district !== undefined ? district.trim() : (current.district || 'Pathanamthitta'),
        state: state !== undefined ? state.trim() : (current.state || 'Kerala'),
        landmark: landmark !== undefined ? landmark.trim() : (current.landmark || ''),
        alternatePhone: alternatePhone !== undefined ? alternatePhone.trim() : (current.alternatePhone || ''),
        addressType: normAddressType,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : Boolean(current.isDefault)
      };

      customer.savedAddresses[addrIdx] = updated;
    }

    customer.markModified('savedAddresses');

    if (updated.isDefault || customer.savedAddresses.length === 1) {
      customer.address = updated.address;
      customer.locality = updated.locality;
      customer.district = updated.district;
      customer.state = updated.state;
      customer.pincode = updated.pincode;
      customer.landmark = updated.landmark;
      customer.addressType = normAddressType;
    }

    await customer.save();

    const custObj = customer.toObject();
    custObj.id = customer._id;

    res.json({
      success: true,
      message: "Address updated successfully",
      data: custObj,
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

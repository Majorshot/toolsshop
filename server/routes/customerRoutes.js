const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const db = require('../utils/db');
const { requireAuth, requireStoreOwner, optionalAuth } = require('../utils/auth');

/**
 * Access Control Helper: Allows access if caller is Store Owner OR the customer themselves
 */
function authorizeCustomerOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }

  // Store owners have full access to customer records
  if (req.user.role === 'store') {
    return next();
  }

  const target = String(req.params.id || '').trim();
  const cleanTargetPhone = target.replace(/[^0-9]/g, '').slice(-10);
  const userPhone = String(req.user.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const userId = String(req.user.id || '');

  // Permit if customer ID matches or phone number matches
  if (userId === target || (cleanTargetPhone.length === 10 && userPhone === cleanTargetPhone)) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied to this customer profile.' });
}

// GET all customers with search, filter, and pagination (Strict Admin only)
router.get('/', requireStoreOwner, async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Failed to retrieve customers' });
  }
});

// ==========================================
// PERSISTENT CART ROUTES (Flipkart/Amazon Sync)
// ==========================================

// Helper: Sanitize cart item fields
function sanitizeCartItem(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id || item._id;
  if (!id) return null;
  const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));
  const price = Math.max(0, Number(item.price) || 0);
  return {
    id: String(id),
    name: String(item.name || 'Equipment').trim(),
    brand: item.brand ? String(item.brand).trim() : '',
    price,
    originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
    discount: item.discount ? String(item.discount).trim() : null,
    image: item.image ? String(item.image).trim() : '',
    quantity: qty,
    stock: typeof item.stock === 'number' ? item.stock : 999,
    deliveryCost: typeof item.deliveryCost === 'number' ? item.deliveryCost : 120,
    cordless: Boolean(item.cordless)
  };
}

// Helper: Find customer by authenticated user token
async function getAuthCustomer(user) {
  if (!user) return null;
  const cleanPhone = String(user.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const conditions = [];
  if (user.id && mongoose.isValidObjectId(user.id)) {
    conditions.push({ _id: user.id });
  }
  if (cleanPhone && cleanPhone.length === 10) {
    conditions.push({ phone: cleanPhone });
    conditions.push({ phone: `+91${cleanPhone}` });
  }
  if (conditions.length === 0) return null;
  return await db.CustomerModel.findOne({ $or: conditions });
}

// GET /api/customers/cart - Retrieve authenticated customer's cloud cart
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const customer = await getAuthCustomer(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }
    return res.json({
      success: true,
      cart: Array.isArray(customer.cart) ? customer.cart : []
    });
  } catch (err) {
    console.error('Error fetching customer cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve cart' });
  }
});

// PUT /api/customers/cart - Replace/update customer's cloud cart
router.put('/cart', requireAuth, async (req, res) => {
  try {
    const customer = await getAuthCustomer(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }
    const incomingCart = Array.isArray(req.body.cart) ? req.body.cart : [];
    const sanitizedCart = incomingCart
      .map(sanitizeCartItem)
      .filter(Boolean);

    customer.cart = sanitizedCart;
    await customer.save();

    return res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: sanitizedCart
    });
  } catch (err) {
    console.error('Error updating customer cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

// POST /api/customers/cart/sync - Merge guest cart with cloud cart on login
router.post('/cart/sync', requireAuth, async (req, res) => {
  try {
    const customer = await getAuthCustomer(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    const existingCart = (Array.isArray(customer.cart) ? customer.cart : [])
      .map(sanitizeCartItem)
      .filter(Boolean);

    const guestCart = (Array.isArray(req.body.cart) ? req.body.cart : [])
      .map(sanitizeCartItem)
      .filter(Boolean);

    // Merge carts Flipkart/Amazon style
    const itemMap = new Map();

    // 1. Load server saved items first
    for (const item of existingCart) {
      itemMap.set(item.id, { ...item });
    }

    // 2. Merge guest items into map
    for (const guestItem of guestCart) {
      if (itemMap.has(guestItem.id)) {
        const existing = itemMap.get(guestItem.id);
        const maxStock = typeof existing.stock === 'number' ? existing.stock : (typeof guestItem.stock === 'number' ? guestItem.stock : 999);
        const combinedQty = Math.min(Math.max(existing.quantity || 1, guestItem.quantity || 1), maxStock);
        itemMap.set(guestItem.id, {
          ...existing,
          ...guestItem,
          quantity: combinedQty
        });
      } else {
        itemMap.set(guestItem.id, { ...guestItem });
      }
    }

    const mergedCart = Array.from(itemMap.values());
    customer.cart = mergedCart;
    await customer.save();

    return res.json({
      success: true,
      message: 'Cart synchronized successfully',
      cart: mergedCart
    });
  } catch (err) {
    console.error('Error syncing customer cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to sync cart' });
  }
});

// DELETE /api/customers/cart - Clear customer's cloud cart
router.delete('/cart', requireAuth, async (req, res) => {
  try {
    const customer = await getAuthCustomer(req.user);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }
    return res.json({ success: true, message: 'Cart cleared successfully', cart: [] });
  } catch (err) {
    console.error('Error clearing customer cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

// GET single customer by ID or phone with purchase history (Admin or Profile Owner)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // If not authenticated, require auth
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    // Check permission
    if (req.user.role !== 'store') {
      const target = String(req.params.id || '').trim();
      const cleanTargetPhone = target.replace(/[^0-9]/g, '').slice(-10);
      const userPhone = String(req.user.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const userId = String(req.user.id || '');
      if (userId !== target && (!cleanTargetPhone || userPhone !== cleanTargetPhone)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const customer = await db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve customer' });
  }
});

// PUT update customer profile (Admin or Profile Owner)
router.put('/:id', requireAuth, authorizeCustomerOrAdmin, async (req, res) => {
  try {
    // Prevent unprivileged customers from modifying admin/CRM flags directly
    const allowedUpdates = { ...req.body };
    if (req.user.role !== 'store') {
      delete allowedUpdates.totalSpent;
      delete allowedUpdates.totalOrders;
      delete allowedUpdates.role;
    }

    const updated = await db.updateCustomer(req.params.id, allowedUpdates);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, message: "Customer updated successfully", data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST add new delivery address (Admin or Profile Owner)
router.post('/:id/addresses', requireAuth, authorizeCustomerOrAdmin, async (req, res) => {
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

// PUT update an existing saved address (Admin or Profile Owner)
router.put('/:id/addresses/:addressId', requireAuth, authorizeCustomerOrAdmin, async (req, res) => {
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

    let addrIdx = customer.savedAddresses.findIndex(
      a => (a.id === req.params.addressId || a._id?.toString() === req.params.addressId)
    );

    if (addrIdx === -1 && (req.params.addressId.startsWith('default') || customer.savedAddresses.length <= 1)) {
      if (customer.savedAddresses.length > 0) {
        addrIdx = 0;
      }
    }

    let updated;

    if (addrIdx === -1) {
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

// PUT mark address as default (Admin or Profile Owner)
router.put('/:id/addresses/:addressId/default', requireAuth, authorizeCustomerOrAdmin, async (req, res) => {
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

// DELETE remove a saved address (Admin or Profile Owner)
router.delete('/:id/addresses/:addressId', requireAuth, authorizeCustomerOrAdmin, async (req, res) => {
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

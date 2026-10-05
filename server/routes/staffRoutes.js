const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { requireStoreOwner, requireFullStoreManager } = require('../utils/auth');

// GET /api/staff - List all staff members
// Accessible by Store Owner, Store Manager, and Workshop Manager (for technician dropdown)
router.get('/', requireStoreOwner, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role.toLowerCase();
    }
    const staff = await db.getStaffMembers(filter);
    res.json(staff);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve staff members: ' + err.message });
  }
});

// POST /api/staff - Create new employee / staff member
// Only Store Owner and Store Manager can add staff
router.post('/', requireFullStoreManager, async (req, res) => {
  try {
    const { name, phone, role, email, password, specialization, active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Employee name is required' });
    }
    if (!role || !['technician', 'workshop_manager', 'manager'].includes(role.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Valid role is required (technician, workshop_manager, manager)' });
    }

    const created = await db.createStaffMember({
      name: name.trim(),
      phone: phone || '',
      role: role.toLowerCase(),
      email: email || '',
      password: password || '',
      specialization: specialization || '',
      active: active !== undefined ? Boolean(active) : true
    });

    res.status(201).json({
      success: true,
      message: `${created.role === 'technician' ? 'Technician' : 'Staff member'} registered successfully`,
      staff: created
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/staff/:id - Update staff details
// Only Store Owner and Store Manager can edit staff
router.put('/:id', requireFullStoreManager, async (req, res) => {
  try {
    const { name, phone, role, email, password, specialization, active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (role !== undefined) {
      if (!['technician', 'workshop_manager', 'manager'].includes(role.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Invalid role specified' });
      }
      updates.role = role.toLowerCase();
    }
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (password !== undefined && password.trim()) updates.password = password.trim();
    if (specialization !== undefined) updates.specialization = specialization.trim();
    if (active !== undefined) updates.active = Boolean(active);

    const updated = await db.updateStaffMember(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({
      success: true,
      message: 'Staff details updated successfully',
      staff: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/staff/:id - Delete staff member
// Only Store Owner and Store Manager can remove staff
router.delete('/:id', requireFullStoreManager, async (req, res) => {
  try {
    const deleted = await db.deleteStaffMember(req.params.id);
    if (!deleted || deleted.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, message: 'Staff member removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

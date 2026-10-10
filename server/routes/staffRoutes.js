const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
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

    const clientOrigin = req.headers.origin || req.headers.referer;

    // 1. Send credentials email ONLY for workshop_manager and manager (technician requires no email/login)
    let emailDispatched = false;
    if (['workshop_manager', 'manager'].includes(created.role) && created.email) {
      emailService.sendStaffWelcomeEmail({
        staff: created,
        password: password ? String(password).trim() : '',
        clientUrl: clientOrigin
      }).catch(err => {
        console.warn('[Staff Email] Non-fatal error sending welcome email:', err.message);
      });
      emailDispatched = true;
    }

    // 2. Send WhatsApp notification for ALL roles (including technician who has a phone number!)
    let whatsappDispatched = false;
    let whatsappUrl = null;
    let waResult = null;
    if (created.phone) {
      try {
        waResult = await whatsappService.sendStaffWelcomeWhatsApp({
          staff: created,
          password: password ? String(password).trim() : '',
          clientUrl: clientOrigin
        });
        whatsappDispatched = !waResult?.error && !waResult?.skipped;
        console.log(`[Staff WhatsApp Registration] Result for ${created.name} (${created.phone}):`, waResult);
      } catch (err) {
        console.warn('[Staff WhatsApp] Non-fatal error sending WhatsApp message:', err.message);
      }

      const cleanPhone = whatsappService.formatPhoneNumber(created.phone);
      const textMsg = whatsappService.getStaffWelcomeWhatsAppText({
        staff: created,
        password: password ? String(password).trim() : '',
        clientUrl: clientOrigin
      });
      whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}` : null;
    }

    res.status(201).json({
      success: true,
      message: `${created.role === 'technician' ? 'Technician' : 'Staff member'} registered successfully${emailDispatched ? ' & credentials emailed' : ''}${whatsappDispatched ? ' & WhatsApp notified' : ''}`,
      staff: created,
      emailDispatched,
      whatsappDispatched,
      whatsappUrl
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/staff/:id/notify-whatsapp - Send/Resend WhatsApp notification to staff member
router.post('/:id/notify-whatsapp', requireFullStoreManager, async (req, res) => {
  try {
    const staff = await db.getStaffMemberById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    if (!staff.phone) {
      return res.status(400).json({ success: false, message: 'Staff member does not have a registered phone number' });
    }

    const clientOrigin = req.headers.origin || req.headers.referer;
    const { tempPassword } = req.body || {};

    let waResult = null;
    try {
      waResult = await whatsappService.sendStaffWelcomeWhatsApp({
        staff,
        password: tempPassword ? String(tempPassword).trim() : '',
        clientUrl: clientOrigin
      });
      console.log(`[Staff WhatsApp Resend] Result for ${staff.name} (${staff.phone}):`, waResult);
    } catch (err) {
      console.warn('[Staff WhatsApp Resend] Non-fatal error sending WhatsApp:', err.message);
    }

    const cleanPhone = whatsappService.formatPhoneNumber(staff.phone);
    const textMsg = whatsappService.getStaffWelcomeWhatsAppText({
      staff,
      password: tempPassword ? String(tempPassword).trim() : '',
      clientUrl: clientOrigin
    });
    const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}` : null;

    res.json({
      success: true,
      message: `WhatsApp notification dispatched to ${staff.name} (${staff.phone})`,
      whatsappUrl,
      waResult
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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

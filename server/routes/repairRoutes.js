const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { requireStoreOwner, optionalAuth } = require('../utils/auth');

// GET /api/repairs - Get all repair jobs (Admin only)
router.get('/', requireStoreOwner, async (req, res) => {
  try {
    const jobs = await db.getRepairJobs();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve repair jobs' });
  }
});

// GET /api/repairs/:id - Get single repair job (Public tracking, but OTP hidden for non-admin)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await db.getRepairJobById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Repair job not found' });

    // Hide secret handoverOtp unless authenticated as store owner
    const isOwner = req.user && req.user.role === 'store';
    const sanitizedJob = isOwner ? job : { ...job, handoverOtp: undefined };

    res.json(sanitizedJob);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve repair job' });
  }
});

// POST /api/repairs - Log a new incoming tool for repair (Admin only)
router.post('/', requireStoreOwner, async (req, res) => {
  try {
    const { customerName, customerPhone, toolModel, issueDescription } = req.body;
    if (!customerName || !customerPhone || !toolModel || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, tool model, and issue description are required'
      });
    }
    const job = await db.createRepairJob(req.body);
    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/repairs/:id - Update status / diagnosis / cost (Admin only)
router.put('/:id', requireStoreOwner, async (req, res) => {
  try {
    const updated = await db.updateRepairJob(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Repair job not found' });
    }
    res.json({ success: true, job: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/repairs/:id/verify-otp - Verify counter OTP for customer pickup (Admin only)
router.post('/:id/verify-otp', requireStoreOwner, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });
    const result = await db.verifyRepairHandoverOtp(req.params.id, otp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/repairs/:id - Delete repair job (Admin only)
router.delete('/:id', requireStoreOwner, async (req, res) => {
  try {
    await db.deleteRepairJob(req.params.id);
    res.json({ success: true, message: 'Repair job deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

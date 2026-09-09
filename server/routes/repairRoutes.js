const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /api/repairs - Get all repair jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await db.getRepairJobs();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/repairs/:id - Get single repair job
router.get('/:id', async (req, res) => {
  try {
    const job = await db.getRepairJobById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Repair job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/repairs - Log a new incoming tool for repair
router.post('/', async (req, res) => {
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

// PUT /api/repairs/:id - Update status / diagnosis / cost
router.put('/:id', async (req, res) => {
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

// POST /api/repairs/:id/verify-otp - Verify counter OTP for customer pickup
router.post('/:id/verify-otp', async (req, res) => {
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

// DELETE /api/repairs/:id - Delete repair job
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteRepairJob(req.params.id);
    res.json({ success: true, message: 'Repair job deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { requireStoreOwner, optionalAuth } = require('../utils/auth');
const whatsappService = require('../services/whatsappService');

// GET /api/repairs - Get all repair jobs (Admin only)
router.get('/', requireStoreOwner, async (req, res) => {
  try {
    const crypto = require('crypto');
    const jobs = await db.getRepairJobs();
    // Auto-heal any jobs where handover was verified or where handoverOtp is missing
    const cleaned = await Promise.all(jobs.map(async j => {
      let updates = null;
      if (j.handoverVerified && j.status !== 'Handed Over') {
        updates = updates || {};
        updates.status = 'Handed Over';
      }
      if (!j.handoverOtp) {
        updates = updates || {};
        updates.handoverOtp = String(crypto.randomInt(1000, 10000));
      }
      if (updates) {
        const targetId = j.id || j.jobId || j._id;
        await db.updateRepairJob(targetId, updates).catch(() => {});
        return { ...j, ...updates };
      }
      return j;
    }));
    res.json(cleaned);
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

    // Asynchronously send WhatsApp confirmation to customer upon ticket creation
    whatsappService.sendRepairTicketCreatedWhatsApp(job).catch(err => {
      console.warn(`[WhatsApp API] Async repair ticket WhatsApp error for #${job.jobId}:`, err.message);
    });

    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/repairs/:id - Update status / diagnosis / cost (Admin only)
router.put('/:id', requireStoreOwner, async (req, res) => {
  try {
    const oldJob = await db.getRepairJobById(req.params.id);
    if (!oldJob) {
      return res.status(404).json({ success: false, message: 'Repair job not found' });
    }

    const wasAlreadyHandedOver = Boolean(oldJob.handoverVerified) || oldJob.status === 'Handed Over';
    // If ticket was already handed over to the customer, protect against accidental stage changes:
    if (wasAlreadyHandedOver && req.body.status && req.body.status !== 'Handed Over') {
      if (!req.body.forceReopen) {
        // Prevent accidental downgrade and lock status to Handed Over
        req.body.status = 'Handed Over';
        req.body.handoverVerified = true;
      }
    }

    const updated = await db.updateRepairJob(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Repair job not found' });
    }

    // When status changes to "Repaired & Ready", automatically send WhatsApp with collection OTP to customer
    // NEVER send if the job was already handed over to the customer!
    const newStatusLower = (req.body.status || updated.status || '').toLowerCase();
    const oldStatusLower = (oldJob?.status || '').toLowerCase();
    if (!wasAlreadyHandedOver &&
        (newStatusLower.includes('repaired') || newStatusLower.includes('ready')) &&
        (!oldStatusLower.includes('ready') && !oldStatusLower.includes('repaired'))) {
      whatsappService.sendRepairReadyWhatsApp(updated).catch(err => {
        console.warn(`[WhatsApp API] Async repair ready WhatsApp notice error for #${updated.jobId}:`, err.message);
      });
    } else if ((newStatusLower.includes('hand') || newStatusLower.includes('over') || newStatusLower.includes('deliver')) &&
        (!oldStatusLower.includes('hand') && !oldStatusLower.includes('deliver'))) {
      whatsappService.sendRepairDeliveredWhatsApp(updated).catch(err => {
        console.warn(`[WhatsApp API] Async repair handover receipt WhatsApp notice error for #${updated.jobId}:`, err.message);
      });
    // When bill/parts/notes are updated and store owner chose to notify customer
    } else if (req.body.sendWhatsAppUpdate || req.body.notifyCustomer) {
      whatsappService.sendRepairEstimateUpdatedWhatsApp(updated, oldJob?.finalCost || oldJob?.estimatedCost).catch(err => {
        console.warn(`[WhatsApp API] Async repair estimate revision WhatsApp notice error for #${updated.jobId}:`, err.message);
      });
    }

    res.json({ success: true, job: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/repairs/:id/send-whatsapp - Resend WhatsApp notification to customer on demand
router.post('/:id/send-whatsapp', requireStoreOwner, async (req, res) => {
  try {
    const job = await db.getRepairJobById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Repair job not found' });
    let waRes;
    if (job.status === 'Handed Over' || job.handoverVerified) {
      waRes = await whatsappService.sendRepairDeliveredWhatsApp(job);
    } else if (job.status === 'Repaired & Ready') {
      waRes = await whatsappService.sendRepairReadyWhatsApp(job);
    } else {
      waRes = await whatsappService.sendRepairTicketCreatedWhatsApp(job);
    }
    res.json({ success: true, message: 'WhatsApp message dispatched to customer', result: waRes });
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

    // Automatically send handover receipt & service guarantee to customer via WhatsApp!
    if (result.job) {
      whatsappService.sendRepairDeliveredWhatsApp(result.job).catch(err => {
        console.warn(`[WhatsApp API] Async repair handover delivery receipt WhatsApp notice error for #${result.job.jobId}:`, err.message);
      });
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

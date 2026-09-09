const express = require('express');
const router = express.Router();
const delhivery = require('../utils/delhivery');

// GET Check pincode serviceability (Delhivery Express)
router.get('/check-pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const result = await delhivery.checkPincode(pincode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Track shipment via Delhivery waybill
router.get('/track/:waybill', async (req, res) => {
  try {
    const { waybill } = req.params;
    const result = await delhivery.trackShipment(waybill);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Delhivery integration status
router.get('/status', (req, res) => {
  const token = delhivery.getApiToken();
  const isConfigured = Boolean(token && token.length > 10);
  const maskedToken = isConfigured ? `${token.slice(0, 6)}...${token.slice(-4)}` : null;

  res.json({
    success: true,
    carrier: "Delhivery Express (Logistics Partner)",
    configured: isConfigured,
    tokenMasked: maskedToken,
    hubOrigin: "Poyanil Building, Kozhencherry, Pathanamthitta, Kerala - PIN: 689641"
  });
});

module.exports = router;

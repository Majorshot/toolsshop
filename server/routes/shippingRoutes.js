const express = require('express');
const router = express.Router();
const courier = require('../utils/courier');

// GET Check pincode serviceability (DTDC & The Professional Couriers)
router.get('/check-pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const result = courier.checkPincode(pincode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Available courier partners
router.get('/couriers', (req, res) => {
  try {
    res.json({
      success: true,
      data: courier.getCouriers()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Track shipment via courier and AWB
router.get('/track/:courierIdentifier/:awb', (req, res) => {
  try {
    const { courierIdentifier, awb } = req.params;
    const result = courier.getTrackingInfo(courierIdentifier, awb);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fallback for single parameter tracking
router.get('/track/:awb', (req, res) => {
  try {
    const { awb } = req.params;
    const result = courier.getTrackingInfo(null, awb);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Courier logistics integration status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    partners: courier.getCouriers().map(c => ({
      id: c.id,
      name: c.name,
      trackingUrl: c.trackingUrl,
      hub: c.originHub
    })),
    hubOrigin: "Poyanil Building, Kozhencherry, Pathanamthitta, Kerala - PIN: 689641",
    activeService: "DTDC Express, The Professional Couriers, Alleppey Parcel Service (APS), Delhivery"
  });
});

module.exports = router;

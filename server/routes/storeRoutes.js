const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET store info, contact, location in Kozhencherry
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: db.getStoreInfo()
  });
});

module.exports = router;

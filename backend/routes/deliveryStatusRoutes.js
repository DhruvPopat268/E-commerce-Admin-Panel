const express = require('express');
const router = express.Router();
const DeliveryStatus = require('../models/DeliveryStatus');

// Get delivery status
router.get('/', async (req, res) => {
  try {
    let status = await DeliveryStatus.findOne();
    if (!status) {
      status = await DeliveryStatus.create({ deliveryStatus: false });
    }
    res.status(200).json({ success: true, deliveryStatus: status.deliveryStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update delivery status
router.patch('/', async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    let status = await DeliveryStatus.findOne();
    if (!status) {
      status = await DeliveryStatus.create({ deliveryStatus });
    } else {
      status.deliveryStatus = deliveryStatus;
      await status.save();
    }
    res.status(200).json({ success: true, deliveryStatus: status.deliveryStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

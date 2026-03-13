const mongoose = require('mongoose');

const deliveryStatusSchema = new mongoose.Schema({
  deliveryStatus: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DeliveryStatus', deliveryStatusSchema);

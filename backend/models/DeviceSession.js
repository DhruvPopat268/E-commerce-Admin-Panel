const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesAgent', required: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);
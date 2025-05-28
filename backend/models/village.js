const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Village name cannot exceed 100 characters']
  },
  status: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will automatically handle createdAt and updatedAt
});

// Pre-save middleware to update the updatedAt field
villageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-update middleware to update the updatedAt field
villageSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Village = mongoose.model('Village', villageSchema);

module.exports = Village;
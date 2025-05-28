const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Village name cannot exceed 100 characters']
  },
  villageCode: {
    type: String,
    required: [true, 'Village code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [10, 'Village code cannot exceed 10 characters']
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

// Function to generate village code from village name
villageSchema.statics.generateVillageCode = function(villageName) {
  // Remove spaces and convert to lowercase
  const cleanName = villageName.toLowerCase().replace(/\s+/g, '');
  
  // Extract consonants (skip vowels: a, e, i, o, u)
  const consonants = cleanName.replace(/[aeiou]/g, '');
  
  // Take first 2 consonants and make uppercase
  if (consonants.length >= 2) {
    return consonants.substring(0, 2).toUpperCase();
  }
  
  // Fallback: if less than 2 consonants, use first 2 characters
  return cleanName.substring(0, 2).toUpperCase();
};

// Function to generate unique village code (handles duplicates)
villageSchema.statics.generateUniqueVillageCode = async function(villageName) {
  const baseCode = this.generateVillageCode(villageName);
  
  // Check if code already exists
  const existingVillage = await this.findOne({ villageCode: baseCode });
  
  if (!existingVillage) {
    return baseCode;
  }
  
  // If duplicate, find all codes with the same base and add number suffix
  const similarCodes = await this.find({ 
    villageCode: { $regex: `^${baseCode}` } 
  }).select('villageCode').sort({ villageCode: 1 });
  
  let counter = 1;
  let newCode = `${baseCode}${counter}`;
  
  // Find the next available number
  while (similarCodes.some(village => village.villageCode === newCode)) {
    counter++;
    newCode = `${baseCode}${counter}`;
  }
  
  return newCode;
};

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
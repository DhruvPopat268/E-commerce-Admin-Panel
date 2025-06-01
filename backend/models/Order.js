const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  orders: [
    {
      productId: String,
      productName: String,
      image: String,
      attributes: Object,
    }
  ],
  orderDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: 'pending', // ✔️ initial status
    enum: ['pending', 'shipped', 'delivered', 'cancelled'], // optional but useful
  }
});

module.exports = mongoose.model('Order', orderSchema);
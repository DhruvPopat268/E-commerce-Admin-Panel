const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
  name: String,
  price: Number,
  discountedPrice: Number,
  quantity: { type: Number, default: 1 },
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // ✅ just a string
    productId: String,
    name: String,
    image: String,
    attributes: [attributeSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);

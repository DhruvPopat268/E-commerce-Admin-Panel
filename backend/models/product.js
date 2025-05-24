const mongoose = require("mongoose");

const AttributeSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  price: { type: Number, required: true },   // price for this attribute, required
  discountedPrice: { type: Number, default: 0 }, // You can change this if you want values to be an array or object
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String },
  visibility: { type: Boolean, default: true },
  status: { type: Boolean, default: true }, 
  image: { type: String }, // store image URL or base64 string
  tags: [{ type: String }],
  attributes: [AttributeSchema],
}, {
  timestamps: true, // adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model("Product", ProductSchema);

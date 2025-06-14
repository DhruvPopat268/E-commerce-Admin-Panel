const mongoose = require("mongoose");

const AttributeSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  price: { type: Number, 
    // required: true 
  },
  discountedPrice: { type: Number, default: 0 },
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, 
      // required: true 
    },
    subCategory: { type: String },
    visibility: { type: Boolean, default: true },
    status: { type: Boolean, default: true },
    image: { type: String },
    tags: [{ type: String }],
    attributes: [AttributeSchema],
    featured: { type: Boolean, default: false },
    showInDailyNeeds: { type: Boolean, default: false }, // ✅ NEW FIELD
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);
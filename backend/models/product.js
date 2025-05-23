// models/Product.js
import mongoose from "mongoose";

const AttributeSchema = new mongoose.Schema({
  name: String,
  values: String,
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    category: String,
    subCategory: String,
    visibility: Boolean,
    image: String,
    price: String,
    stock: String,
    discountType: String,
    discountValue: String,
    taxType: String,
    taxRate: String,
    tags: [String],
    attributes: [AttributeSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);

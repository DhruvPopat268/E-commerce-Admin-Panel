const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// POST /api/products - create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subCategory,
      image,
      tags,
      visibility,
      attributes
    } = req.body;

    const newProduct = new Product({
      name,
      description,
      category,
      subCategory,
      image,
      tags,
      visibility,
      attributes,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({ success: true, product: savedProduct });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;

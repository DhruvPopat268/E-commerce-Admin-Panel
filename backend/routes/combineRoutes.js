const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Banner = require('../models/bannerModel');
const Product = require('../models/product');

router.get('/', async (req, res) => {
  try {
    const [categories, bannersRaw, dailyNeedsProducts] = await Promise.all([
      Category.find(),
      Banner.find()
        .sort({ createdAt: -1 })
        .populate('categoryId', 'name')
        .populate('subcategoryId', 'name'),
      Product.find({ showInDailyNeeds: true })
    ]);

    // Process banners to add image URLs
    const banners = bannersRaw.map(banner => ({
      ...banner.toObject(),
      imageUrl: banner.image ? `/uploads/${banner.image}` : null
    }));

    // Send combined response
    res.json({
      categories,
      banners,
      dailyneed: dailyNeedsProducts
    });
  } catch (error) {
    console.error("Error fetching combined data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Banner = require('../models/bannerModel');
const Product = require('../models/product');
const jwt = require('jsonwebtoken');

// Use your actual JWT secret here (e.g., from .env)

router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(' ')[1]; // If "Bearer <token>"

  try {
    // Verify the token using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: Log or use the decoded data
    console.log('Decoded token:', decoded);

    // Proceed with fetching data
    const [categories, bannersRaw, dailyNeedsProducts] = await Promise.all([
      Category.find(),
      Banner.find()
        .sort({ createdAt: -1 })
        .populate('categoryId', 'name')
        .populate('subcategoryId', 'name'),
      Product.find({ showInDailyNeeds: true })
    ]);

    const banners = bannersRaw.map(banner => ({
      ...banner.toObject(),
      imageUrl: banner.image ? `/uploads/${banner.image}` : null
    }));

    res.status(200).json({
      categories,
      banners,
      dailyneed: dailyNeedsProducts
    });

  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});


module.exports = router;

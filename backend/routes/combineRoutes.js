const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Banner = require('../models/bannerModel');
const Product = require('../models/product');
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

    const dailyneed = dailyNeedsProducts.map(product => {
      const productObj = product.toObject();
      const firstAttribute = productObj.attributes && productObj.attributes.length > 0
        ? productObj.attributes[0]
        : null;

      return {
        featured: productObj.featured,
        _id: productObj._id,
        name: firstAttribute?.name || productObj.name,
        description: productObj.description,
        category: productObj.category,
        subCategory: productObj.subCategory,
        visibility: productObj.visibility,
        status: productObj.status,
        price: firstAttribute?.price || productObj.price,
        discountedPrice: firstAttribute?.discountedPrice || productObj.discountedPrice,
        image: productObj.image,
        createdAt: productObj.createdAt,
        updatedAt: productObj.updatedAt,
        __v: productObj.__v,
        showInDailyNeeds: productObj.showInDailyNeeds
      };
    });

    res.status(200).json({
      categories,
      banners,
      dailyneed
    });

  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

module.exports = router;

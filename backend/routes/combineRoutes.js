const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const SubCategory = require('../models/SubCategory'); // Add this line - adjust path if needed
const Banner = require('../models/bannerModel');
const Product = require('../models/product');
const jwt = require('jsonwebtoken');
const salesAgent = require('../routes/salesAgentRoute')
const routeSetup = require('../routes/routeSetupRputes')

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

    // Get all unique category and subcategory IDs from products
    const categoryIds = [...new Set(dailyNeedsProducts.map(p => p.category).filter(Boolean))];
    const subCategoryIds = [...new Set(dailyNeedsProducts.map(p => p.subCategory).filter(Boolean))];

    // Fetch category and subcategory details
    const [categoryDetails, subCategoryDetails] = await Promise.all([
      Category.find({ _id: { $in: categoryIds } }).select('_id name'),
      SubCategory.find({ _id: { $in: subCategoryIds } }).select('_id name') // Use SubCategory model
    ]);

    // Create lookup maps
    const categoryMap = new Map(categoryDetails.map(cat => [cat._id.toString(), cat]));
    const subCategoryMap = new Map(subCategoryDetails.map(subCat => [subCat._id.toString(), subCat]));

    const banners = bannersRaw.map(banner => {
      const bannerObj = banner.toObject();

      return {
        ...bannerObj,
        subcategoryId: bannerObj.subcategoryId?._id || bannerObj.subcategoryId || null,
        imageUrl: bannerObj.image ? `/uploads/${bannerObj.image}` : null
      };
    });


    const dailyneed = dailyNeedsProducts.map(product => {
      const productObj = product.toObject();
      const firstAttribute = productObj.attributes && productObj.attributes.length > 0
        ? productObj.attributes[0]
        : null;

      // Get category and subcategory details from maps
      const categoryDetail = categoryMap.get(productObj.category);
      const subCategoryDetail = subCategoryMap.get(productObj.subCategory);

      return {
        featured: productObj.featured,
        _id: productObj._id,
        productName: productObj.name, // Product name from Product model
        name: firstAttribute?.name || productObj.name, // Attribute name or fallback to product name
        description: productObj.description,
        category: categoryDetail ? {
          _id: categoryDetail._id,
          name: categoryDetail.name
        } : {
          _id: productObj.category,
          name: null
        },
        subCategory: subCategoryDetail ? {
          _id: subCategoryDetail._id,
          name: subCategoryDetail.name
        } : {
          _id: productObj.subCategory,
          name: null
        },
        visibility: productObj.visibility,
        status: productObj.status,
        price: firstAttribute?.price || productObj.price, // Attribute price or fallback to product price
        discountedPrice: firstAttribute?.discountedPrice || productObj.discountedPrice, // Attribute discounted price or fallback
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
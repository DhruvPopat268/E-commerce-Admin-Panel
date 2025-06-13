const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require("jsonwebtoken")
const subCategory = require('../models/SubCategory')
const category = require('../models/category')
const XLSX = require('xlsx');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// Excel file storage configuration (temporary storage)
const excelStorage = multer.memoryStorage();

// Upload configurations
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for Excel files
});

// Helper function to process Excel data
const processExcelData = (buffer, filename) => {
  try {
    let workbook;
    
    // Handle different file types
    if (filename.endsWith('.csv')) {
      const csvData = buffer.toString('utf8');
      workbook = XLSX.read(csvData, { type: 'string' });
    } else {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return jsonData;
  } catch (error) {
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
};

// Helper function to validate and transform product data
const validateAndTransformProduct = async (row, index, categories, subcategories) => {
  const errors = [];

  const name = row.name?.trim();
  const categoryName = row.Category?.trim();
  const subcategoryName = row.Subcategory?.trim();

  if (!name) errors.push(`Row ${index + 2}: Product name is required`);
  if (!categoryName) errors.push(`Row ${index + 2}: Category is required`);
  if (!subcategoryName) errors.push(`Row ${index + 2}: Subcategory is required`);

  const matchedCategory = categories.find(c => c.name.trim().toLowerCase() === categoryName.toLowerCase());
  const matchedSubcategory = subcategories.find(
    s => s.name.trim().toLowerCase() === subcategoryName.toLowerCase() &&
         matchedCategory && s.categoryId === matchedCategory._id
  );

  if (!matchedCategory) errors.push(`Row ${index + 2}: Category '${categoryName}' not found`);
  if (!matchedSubcategory) errors.push(`Row ${index + 2}: Subcategory '${subcategoryName}' not found for category '${categoryName}'`);

  const product = {
    name,
    description: '',
    category: matchedCategory?._id || null,
    subCategory: matchedSubcategory?._id || null,
    visibility: true,
    status: true,
    image: '',
    tags: [],
    featured: false,
    showInDailyNeeds: false,
    attributes: []
  };

  return { product, errors };
};



router.post('/', uploadImage.single('image'), async (req, res) => {
  try {
    // Parse JSON strings back to objects
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (req.body.attributes && typeof req.body.attributes === 'string') {
      req.body.attributes = JSON.parse(req.body.attributes);
    }
    
    // Convert string values to appropriate types for attributes
    if (req.body.attributes && Array.isArray(req.body.attributes)) {
      req.body.attributes = req.body.attributes.map(attr => ({
        ...attr,
        price: Number(attr.price),
        discountedPrice: Number(attr.discountedPrice)
      }));
    }
    
    // Convert visibility string to boolean
    if (typeof req.body.visibility === 'string') {
      req.body.visibility = req.body.visibility === 'true';
    }
    
    const product = new Product(req.body);
    
    // Handle image upload with Cloudinary
    if (req.file) {
      product.image = req.file.path;
    }
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message });
  }
});

// Bulk import route (new)
router.post('/bulk-import', uploadExcel.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const excelData = processExcelData(req.file.buffer, req.file.originalname);

    if (!excelData || excelData.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty or invalid' });
    }

    // Use your in-memory or fetched state here
    const categories = await category.find({}); // replace this with actual state if dynamic
    const subcategories = await subCategory.find({});

    const results = {
      total: excelData.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    const successfulProducts = [];

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];

      try {
        const { product, errors } = await validateAndTransformProduct(row, i, categories, subcategories);

        if (errors.length > 0) {
          results.errors.push(...errors);
          results.failed++;
          continue;
        }

        const newProduct = new Product(product);
        await newProduct.save();

        successfulProducts.push(newProduct);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed. ${results.successful} products created, ${results.failed} failed.`,
      results,
      products: successfulProducts
    });

  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk import', error: error.message });
  }
});

router.get('/download-template', (req, res) => {
  try {
    const sampleData = [
      { name: 'Tea-Tree Facewash', Category: 'Body Care', Subcategory: 'Facewash' },
      { name: 'Tea-Tree Bodywash', Category: 'Body Care', Subcategory: 'Bodywash' },
      { name: 'Motorolla edge 60 pro', Category: 'Electronics', Subcategory: 'mobiles' }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=product-import-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the product ID
    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let product = await Product.findById(id)
      .populate({
        path: "category", // This should match the field name in Product schema
        model: "Category",  // Mongoose model name (should match how it's registered)
        select: "name",     // Only fetch the category name
      })
      .populate({
        path: "subCategory", // Same, adjust field name as per your schema
        model: "SubCategory",
        select: "name",        // Only fetch the subcategory name
      });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (err) {
    console.log("Error: " + err);
    
    // Handle specific MongoDB errors
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/daily-needs', async (req, res) => {
  try {
    const dailyNeedsProducts = await Product.find({ showInDailyNeeds: true })
    res.json(dailyNeedsProducts)
  } catch (error) {
    console.error("Error fetching daily needs products:", error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post("/subcategory", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    const subCategoryId = req.body.id;

    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory ID format",
      });
    }

    const subCategoryExists = await subCategory.findById(subCategoryId);
    if (!subCategoryExists) {
      return res.status(404).json({
        success: false,
        message: "Subcategory ID does not exist",
      });
    }

    const subCategoryName = subCategoryExists.name;

    const products = await Product.find({ subCategory: subCategoryId });

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        subCategoryId,
        count: 0,
        data: [],
      });
    }

    const modifiedProducts = products.map((product) => {
      const productObj = product.toObject();
      const firstAttr = productObj.attributes?.[0];

      return {
        ...productObj,
        subCategoryName,
        attributeName: firstAttr?.name || null,
        price: firstAttr?.price || null,
        discountedPrice: firstAttr?.discountedPrice || null,
        subCategoryName, // ✅ Add this line
        attributes: undefined,
      };
    });

    return res.status(200).json({
      success: true,
      subCategoryId,
      count: modifiedProducts.length,
      data: modifiedProducts,
    });

  } catch (error) {
    console.error("Error fetching products by subcategory ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/productDetail", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({ 
      success: false,
      message: "Access denied. No token provided." 
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const productId = req.body.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    // Get subCategoryName
    let subCategoryName = null;
    if (product.subCategory) {
      const subCat = await subCategory.findById(product.subCategory);
      subCategoryName = subCat?.name || null;
    }

    const productObj = product.toObject();
    productObj.subCategoryName = subCategoryName;

    res.status(200).json({
      success: true,
      productId: productId,
      
      data: productObj  // Now includes subCategoryName
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

router.put('/:id', uploadImage.single('image'), async (req, res) => {
  try {
    // Parse JSON strings back to objects
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }

    if (req.body.attributes && typeof req.body.attributes === 'string') {
      req.body.attributes = JSON.parse(req.body.attributes);
    }

    // Convert string values to appropriate types for attributes
    if (req.body.attributes && Array.isArray(req.body.attributes)) {
      req.body.attributes = req.body.attributes.map(attr => ({
        ...attr,
        price: Number(attr.price),
        discountedPrice: Number(attr.discountedPrice)
      }));
    }

    // Convert visibility string to boolean
    if (typeof req.body.visibility === 'string') {
      req.body.visibility = req.body.visibility === 'true';
    }

    // Handle image update with Cloudinary cleanup
    if (req.file) {
      // Get the old product to delete old image from Cloudinary
      const oldProduct = await Product.findById(req.params.id);

      // Delete old image from Cloudinary if it exists
      if (oldProduct && oldProduct.image) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = oldProduct.image
            .split('/')
            .slice(-2) // Get last two parts: folder/filename
            .join('/')
            .split('.')[0]; // Remove file extension

          await cloudinary.uploader.destroy(publicId);
          console.log('Old product image deleted from Cloudinary:', publicId);
        } catch (deleteError) {
          console.error('Error deleting old product image from Cloudinary:', deleteError);
          // Continue with update even if old image deletion fails
        }
      }

      // Add new image URL to update data
      req.body.image = req.file.path; // Store full Cloudinary URL
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE Route - Delete Product
router.delete('/:id', async (req, res) => {
  try {
    // Get the product first to access image URL
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image from Cloudinary if it exists
    if (product.image) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = product.image
          .split('/')
          .slice(-2) // Get last two parts: folder/filename
          .join('/')
          .split('.')[0]; // Remove file extension

        await cloudinary.uploader.destroy(publicId);
        console.log('Product image deleted from Cloudinary:', publicId);
      } catch (deleteError) {
        console.error('Error deleting product image from Cloudinary:', deleteError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete the product from database
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Product deleted successfully',
      success: true,
      data: deletedProduct
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      message: 'Server error',
      success: false
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { categoryId, subCategoryId, search, page = 1, limit = 10, status } = req.query;
   
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;
   
    // Build query object for filtering
    let query = {};
   
    // Filter by category if provided
    if (categoryId) {
      query.category = categoryId;
    }
   
    // Filter by subcategory if provided
    if (subCategoryId) {
      query.subCategory = subCategoryId;
    }
   
    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { sku: { $regex: searchTerm, $options: 'i' } }
        // You can add more searchable fields here if needed
        // { brand: { $regex: searchTerm, $options: 'i' } }
      ];
    }
   
    // Filter by status if provided
    if (status !== undefined && status !== '') {
      query.status = status === 'true';
    }
   
    // Execute query with Promise.all for better performance
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate({
          path: "category", // This should match the field name in Product schema
          model: "Category",  // Mongoose model name (should match how it's registered)
          select: "name",     // Only fetch the category name
        })
        .populate({
          path: "subCategory", // Same, adjust field name as per your schema
          model: "SubCategory",
          select: "name",        // Only fetch the subcategory name
        })
        .sort({ createdAt: -1 }) // Sort by newest first, you can change this
        .skip(skip)
        .limit(limitNum)
        .lean(), // Use lean() for better performance
      Product.countDocuments(query)
    ]);
   
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
   
    // Return response in consistent format with category route
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current: pageNum,
        total: totalPages,
        count: products.length,
        totalRecords: totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
   
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  const productId = req.params.id;
  const { status } = req.body; // expect status as boolean in the request body

  if (typeof status !== "boolean") {
    return res.status(400).json({ error: "Status must be a boolean." });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { status: status },
      { new: true } // return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
});

// PATCH /api/products/:id/daily-needs
router.patch("/:id/daily-needs", async (req, res) => {
  try {
    const { id } = req.params;
    const { showInDailyNeeds } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { showInDailyNeeds },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating showInDailyNeeds:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/by-tags', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { tagName } = req.body;
   
    // Validate input
    if (!tagName) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }
    
    // Find products that contain the specified tag and have status: true
    const products = await Product.find({
      tags: { $in: [tagName] },
      status: true
    });
    
    // Transform products to include only first attribute's specific fields
    const transformedProducts = products.map(product => {
      const productObj = product.toObject();
      
      // Get first attribute and merge its fields directly into product object
      if (productObj.attributes && productObj.attributes.length > 0) {
        const firstAttribute = productObj.attributes[0];
        productObj.attributeName = firstAttribute.name;
        productObj.price = firstAttribute.price;
        productObj.discountedPrice = firstAttribute.discountedPrice;
        productObj.attributeId = firstAttribute._id;
      } else {
        productObj.attributeName = null;
        productObj.price = null;
        productObj.discountedPrice = null;
        productObj.attributeId = null;
      }
      
      // Remove the original attributes array
      delete productObj.attributes;
      
      return productObj;
    });
    
    // Return response - always 200 status code
    res.status(200).json({
      success: true,
      count: transformedProducts.length,
      data: transformedProducts
    });
  } catch (error) {
    console.error('Error fetching products by tag:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});



module.exports = router;
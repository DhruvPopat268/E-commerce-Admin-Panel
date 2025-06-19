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
    if (filename.endsWith('.csv')) {
      const csvData = buffer.toString('utf8');
      workbook = XLSX.read(csvData, { type: 'string' });
    } else {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header detection
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      blankrows: false
    });
    
    if (!jsonData || jsonData.length < 2) {
      throw new Error('Excel file must contain at least a header row and one data row');
    }
    
    console.log('Raw Excel data:', jsonData);
    
    // Get headers and normalize them
    const headers = jsonData[0].map(h => String(h || '').trim());
    console.log('Headers found:', headers);
    
    // Process data rows
    const processedData = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowData = { rowNumber: i + 1 }; // Excel row number
      
      headers.forEach((header, index) => {
        const cellValue = row[index];
        const normalizedValue = cellValue ? String(cellValue).trim() : '';
        
        // Map headers to expected field names
        const lowerHeader = header.toLowerCase();
        if (lowerHeader === 'name' || lowerHeader === 'product name' || lowerHeader === 'product') {
          rowData.name = normalizedValue;
        } else if (lowerHeader === 'category') {
          rowData.category = normalizedValue;
        } else if (lowerHeader === 'subcategory' || lowerHeader === 'sub category') {
          rowData.subcategory = normalizedValue;
        } else if (lowerHeader === 'description') {
          rowData.description = normalizedValue;
        } else if (lowerHeader === 'price') {
          rowData.price = parseFloat(normalizedValue) || 0;
        } else if (lowerHeader === 'stock' || lowerHeader === 'quantity') {
          rowData.stock = parseInt(normalizedValue) || 0;
        }
      });
      
      // Only add rows that have at least a name
      if (rowData.name && rowData.name.length > 0) {
        processedData.push(rowData);
      }
    }
    
    console.log('Processed data:', processedData);
    return processedData;
    
  } catch (error) {
    console.error('Excel processing error:', error);
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
};

// Helper function to find or create category
const findOrCreateCategory = async (categoryName) => {
  try {
    console.log(`🔍 Finding or creating category: ${categoryName}`);
    
    // First try to find existing category
    let matchedCategory = await category.findOne({
      name: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') }
    }).lean();
    
    if (matchedCategory) {
      console.log('✅ Existing category found:', matchedCategory.name, 'ID:', matchedCategory._id);
      return matchedCategory;
    }
    
    // Create new category if not found
    console.log('🆕 Creating new category:', categoryName);
    const newCategory = new category({
      name: categoryName.trim(),
      status: true,
      visibility: true
    });
    
    const savedCategory = await newCategory.save();
    console.log('✅ New category created:', savedCategory.name, 'ID:', savedCategory._id);
    
    return savedCategory.toObject();
    
  } catch (error) {
    console.error('Error in findOrCreateCategory:', error);
    throw new Error(`Failed to find or create category '${categoryName}': ${error.message}`);
  }
};

// Helper function to find or create subcategory
const findOrCreateSubcategory = async (subcategoryName, categoryId, categoryName) => {
  try {
    console.log(`🔍 Finding or creating subcategory: ${subcategoryName} for category: ${categoryName}`);
    
    // First try to find existing subcategory
    let matchedSubcategory = await subCategory.findOne({
      name: { $regex: new RegExp(`^${subcategoryName.trim()}$`, 'i') }
    }).lean();
    
    if (matchedSubcategory) {
      console.log('✅ Existing subcategory found:', matchedSubcategory.name, 'ID:', matchedSubcategory._id);
      
      // Check if subcategory belongs to the correct category
      let subcategoryCategoryId = matchedSubcategory.category || matchedSubcategory.categoryId;
      
      if (subcategoryCategoryId && subcategoryCategoryId.toString() === categoryId.toString()) {
        console.log('✅ Subcategory belongs to correct category');
        return matchedSubcategory;
      } else {
        console.log('⚠️ Subcategory exists but belongs to different category');
        // You can either:
        // 1. Create a new subcategory with same name but different category
        // 2. Update existing subcategory to new category
        // 3. Throw error
        // Here we'll create a new one with a slightly different approach
        console.log('🆕 Creating new subcategory with same name for different category');
      }
    }
    
    // Create new subcategory
    console.log('🆕 Creating new subcategory:', subcategoryName);
    const newSubcategory = new subCategory({
      name: subcategoryName.trim(),
      category: categoryId, // Use category field
      categoryId: categoryId, // Also set categoryId field for compatibility
      status: true,
      visibility: true
    });
    
    const savedSubcategory = await newSubcategory.save();
    console.log('✅ New subcategory created:', savedSubcategory.name, 'ID:', savedSubcategory._id);
    
    return savedSubcategory.toObject();
    
  } catch (error) {
    console.error('Error in findOrCreateSubcategory:', error);
    throw new Error(`Failed to find or create subcategory '${subcategoryName}': ${error.message}`);
  }
};

// Helper function to validate and transform product data
const validateAndTransformProduct = async (row) => {
  console.log(`\n=== Validating Row ${row.rowNumber} ===`);
  console.log('Row data:', row);
  
  const errors = [];
  const { name, category: categoryName, subcategory: subcategoryName, description = '', price = 0, stock = 0, rowNumber } = row;
  
  // Log what we're validating
  console.log('Validating:', { name, categoryName, subcategoryName });
  
  // Required field validation with detailed logging
  if (!name || name.trim().length === 0) {
    console.log('❌ Name validation failed:', name);
    errors.push(`Row ${rowNumber}: Product name is required`);
  } else {
    console.log('✅ Name validation passed:', name);
  }
  
  if (!categoryName || categoryName.trim().length === 0) {
    console.log('❌ Category validation failed:', categoryName);
    errors.push(`Row ${rowNumber}: Category is required`);
  } else {
    console.log('✅ Category validation passed:', categoryName);
  }
  
  if (!subcategoryName || subcategoryName.trim().length === 0) {
    console.log('❌ Subcategory validation failed:', subcategoryName);
    errors.push(`Row ${rowNumber}: Subcategory is required`);
  } else {
    console.log('✅ Subcategory validation passed:', subcategoryName);
  }
  
  // Early return if required fields are missing
  if (errors.length > 0) {
    console.log('❌ Basic validation failed, errors:', errors);
    return { product: null, errors };
  }
  
  // Step 1: Find or create category
  console.log('🔍 Step 1: Finding or creating category...');
  let matchedCategory;
  try {
    matchedCategory = await findOrCreateCategory(categoryName);
  } catch (error) {
    console.error('Error finding/creating category:', error);
    errors.push(`Row ${rowNumber}: ${error.message}`);
    return { product: null, errors };
  }
  
  // Step 2: Find or create subcategory
  console.log('🔍 Step 2: Finding or creating subcategory...');
  let matchedSubcategory;
  try {
    matchedSubcategory = await findOrCreateSubcategory(subcategoryName, matchedCategory._id, categoryName);
  } catch (error) {
    console.error('Error finding/creating subcategory:', error);
    errors.push(`Row ${rowNumber}: ${error.message}`);
    return { product: null, errors };
  }
  
  // Step 3: Check for duplicate product name
  console.log('🔍 Step 3: Checking for duplicate products...');
  try {
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });
    
    if (existingProduct) {
      console.log('❌ Duplicate product found:', existingProduct.name);
      errors.push(`Row ${rowNumber}: Product '${name}' already exists`);
      return { product: null, errors };
    } else {
      console.log('✅ No duplicate product found');
    }
  } catch (dbError) {
    console.error('Database error during duplicate check:', dbError);
    errors.push(`Row ${rowNumber}: Database error during duplicate check: ${dbError.message}`);
    return { product: null, errors };
  }
  
  // Step 4: Validate price and stock
  console.log('🔍 Step 4: Validating price and stock...');
  const finalPrice = isNaN(price) ? 0 : Math.max(0, parseFloat(price));
  const finalStock = isNaN(stock) ? 0 : Math.max(0, parseInt(stock));
  
  if (price < 0) {
    errors.push(`Row ${rowNumber}: Price cannot be negative`);
  }
  
  if (stock < 0) {
    errors.push(`Row ${rowNumber}: Stock cannot be negative`);
  }
  
  if (errors.length > 0) {
    return { product: null, errors };
  }
  
  // Step 5: Create product object
  console.log('🔍 Step 5: Creating product object...');
  const product = {
    name: name.trim(),
    description: description.trim() || '',
    category: matchedCategory._id,
    subCategory: matchedSubcategory._id,
    price: finalPrice,
    stock: finalStock,
    visibility: true,
    status: true,
    image: '',
    tags: [],
    featured: false,
    showInDailyNeeds: false,
    attributes: []
  };
  
  console.log('✅ Product object created successfully:', {
    name: product.name,
    categoryId: product.category,
    subCategoryId: product.subCategory,
    price: product.price,
    stock: product.stock
  });
  
  return { product, errors };
};

router.post('/', uploadImage.array('images', 10), async (req, res) => {
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
    
    // Handle multiple image uploads with Cloudinary
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(file => file.path);
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
  console.log('\n🚀 Starting bulk import process...');
  
  try {
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        success: false, 
        message: 'No Excel file uploaded' 
      });
    }
    
    console.log('📁 File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Process Excel data
    let excelData;
    try {
      excelData = processExcelData(req.file.buffer, req.file.originalname);
      console.log(`📊 Processed ${excelData.length} rows from Excel`);
    } catch (error) {
      console.log('❌ Excel processing failed:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: `Error processing Excel file: ${error.message}` 
      });
    }
    
    if (!excelData || excelData.length === 0) {
      console.log('❌ No valid data found in Excel');
      return res.status(400).json({ 
        success: false, 
        message: 'Excel file contains no valid data rows' 
      });
    }
    
    // Initialize results tracking
    const results = {
      total: excelData.length,
      successful: 0,
      failed: 0,
      errors: [],
      categoriesCreated: 0,
      subcategoriesCreated: 0
    };
    
    const successfulProducts = [];
    const createdCategories = [];
    const createdSubcategories = [];
    
    // Process each row
    console.log('🔄 Processing rows...');
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      console.log(`\n--- Processing row ${i + 1}/${excelData.length} ---`);
      
      try {
        const { product, errors } = await validateAndTransformProduct(row);
        
        if (errors.length > 0) {
          console.log(`❌ Validation failed for row ${row.rowNumber}:`, errors);
          results.errors.push(...errors);
          results.failed++;
          continue;
        }
        
        if (!product) {
          console.log(`❌ No product object created for row ${row.rowNumber}`);
          results.failed++;
          results.errors.push(`Row ${row.rowNumber}: Failed to create product object`);
          continue;
        }
        
        // Create and save the product
        console.log(`💾 Saving product: ${product.name}`);
        const newProduct = new Product(product);
        const savedProduct = await newProduct.save();
        
        successfulProducts.push({
          id: savedProduct._id,
          name: savedProduct.name,
          category: savedProduct.category,
          subCategory: savedProduct.subCategory,
          price: savedProduct.price,
          stock: savedProduct.stock
        });
        
        results.successful++;
        console.log(`✅ Successfully saved: ${savedProduct.name} (ID: ${savedProduct._id})`);
        
      } catch (error) {
        console.log(`❌ Database error for row ${row.rowNumber}:`, error.message);
        console.error('Error details:', error);
        results.failed++;
        results.errors.push(`Row ${row.rowNumber}: Database error - ${error.message}`);
      }
    }
    
    // Prepare response
    console.log('\n📊 Import Summary:', {
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      errorCount: results.errors.length,
      categoriesCreated: results.categoriesCreated,
      subcategoriesCreated: results.subcategoriesCreated
    });
    
    let message = `Bulk import completed. ${results.successful} products created, ${results.failed} failed.`;
    if (results.categoriesCreated > 0 || results.subcategoriesCreated > 0) {
      message += ` ${results.categoriesCreated} categories and ${results.subcategoriesCreated} subcategories were automatically created.`;
    }
    
    const response = {
      success: results.successful > 0, // Consider success if at least one product was created
      message: message,
      results: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        categoriesCreated: results.categoriesCreated,
        subcategoriesCreated: results.subcategoriesCreated,
        errors: results.errors.slice(0, 50) // Limit errors to first 50 to avoid large responses
      }
    };
    
    if (successfulProducts.length > 0) {
      response.products = successfulProducts;
    }
    
    if (createdCategories.length > 0) {
      response.createdCategories = createdCategories;
    }
    
    if (createdSubcategories.length > 0) {
      response.createdSubcategories = createdSubcategories;
    }
    
    // Log final response
    console.log('📋 Final response prepared');
    res.status(200).json(response);
    
  } catch (error) {
    console.error('💥 Fatal error in bulk import:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process bulk import', 
      error: error.message 
    });
  }
});

router.get('/download-template', async (req, res) => {
  try {
    // Optional: Fetch actual categories and subcategories for more realistic examples
    const categories = await category.find({}).lean();
    const subcategories = await subCategory.find({}).lean();
    
    // Create sample data with real categories if available, otherwise use hardcoded examples
    let sampleData;
    
    if (categories.length > 0 && subcategories.length > 0) {
      // Use real data from database
      const bodyCategory = categories.find(c => c.name.toLowerCase().includes('body'));
      const electronicsCategory = categories.find(c => c.name.toLowerCase().includes('electronic'));
      
      sampleData = [
        { 
          name: 'Tea-Tree Facewash', 
          Category: bodyCategory?.name || 'Body Care', 
          Subcategory: 'Facewash',
          description: 'Natural tea tree face wash for all skin types',
          price: 299,
          stock: 50
        },
        { 
          name: 'Tea-Tree Bodywash', 
          Category: bodyCategory?.name || 'Body Care', 
          Subcategory: 'Bodywash',
          description: 'Refreshing tea tree body wash',
          price: 399,
          stock: 30
        },
        { 
          name: 'Motorola Edge 60 Pro', 
          Category: electronicsCategory?.name || 'Electronics', 
          Subcategory: 'mobiles',
          description: 'Latest smartphone with advanced features',
          price: 25999,
          stock: 10
        }
      ];
    } else {
      // Fallback to hardcoded examples
      sampleData = [
        { 
          name: 'Tea-Tree Facewash', 
          Category: 'Body Care', 
          Subcategory: 'Facewash',
          description: 'Natural tea tree face wash for all skin types',
          price: 299,
          stock: 50
        },
        { 
          name: 'Tea-Tree Bodywash', 
          Category: 'Body Care', 
          Subcategory: 'Bodywash',
          description: 'Refreshing tea tree body wash',
          price: 399,
          stock: 30
        },
        { 
          name: 'Motorola Edge 60 Pro', 
          Category: 'Electronics', 
          Subcategory: 'mobiles',
          description: 'Latest smartphone with advanced features',
          price: 25999,
          stock: 10
        }
      ];
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 25 }, // name
      { wch: 15 }, // Category
      { wch: 15 }, // Subcategory
      { wch: 40 }, // description
      { wch: 10 }, // price
      { wch: 8 }   // stock
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add some styling to headers (optional - makes template look more professional)
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    // Apply header styling (A1 to F1)
    const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'];
    headerCells.forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = headerStyle;
      }
    });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Disposition', 'attachment; filename=product-import-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate template',
      error: error.message 
    });
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
      console.log(firstAttr);

      return {
        ...productObj,
        subCategoryName,
        attributeName: firstAttr?.name ?? null,
        // Fix: Use nullish coalescing (??) instead of logical OR (||)
        // This will only return null if firstAttr.price is null or undefined
        // 0 is a valid price value and should not be converted to null
        price: firstAttr?.price ?? null,
        discountedPrice: firstAttr?.discountedPrice ?? null,
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
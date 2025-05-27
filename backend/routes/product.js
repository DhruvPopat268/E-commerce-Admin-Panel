const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const multer = require('multer');
const path = require('path');

// POST /api/products - create new product
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// In your product route (product.js)
router.post('/', upload.single('image'), async (req, res) => {
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
    if (req.file) {
      product.image = req.file.filename; // or however you handle image storage
    }
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// Similar fix for PUT route
router.put('/:id', upload.single('image'), async (req, res) => {
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

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (req.file) {
      product.image = req.file.filename;
      await product.save();
    }
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/", async (req, res) => {
    try {
        let products = await Product.find({})

        res.status(200).json(products);
    } catch (err) {
        console.log("Error: " + err);
    }
})

router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
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

// GET /api/products/:id - get a single product by ID




module.exports = router;
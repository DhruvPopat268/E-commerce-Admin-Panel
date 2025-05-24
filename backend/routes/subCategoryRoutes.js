const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Get all subcategories with populated category name
// GET /api/subcategories
router.get("/", async (req, res) => {
  try {
    // 👇 add .populate('category', 'name')
    const subCategories = await SubCategory.find().populate("category", "name").exec();
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new subcategory
router.post('/', upload.single('image'), async (req, res) => {
  const { categoryId, name, status } = req.body;
  const imageFile = req.file; // Get the uploaded file

  if (!categoryId || !name) {
    return res.status(400).json({ message: "Category and name are required" });
  }

  try {
    // Create subcategory object with or without image
    const subCategoryData = {
      category: categoryId,
      name,
      status: status !== undefined ? status : true,
    };

    // If image was uploaded, add it to the data
    if (imageFile) {
      // Here you would typically:
      // 1. Upload to Cloudinary/S3
      // 2. Get the image URL
      // 3. Add to subCategoryData
      subCategoryData.image = `/uploads/${imageFile.filename}`; // Temporary local path
      // For production, use something like:
      // subCategoryData.image = await uploadToCloudinary(imageFile);
    }

    const subCategory = new SubCategory(subCategoryData);
    const savedSubCategory = await subCategory.save();

    // Populate category name and return the saved subcategory
    const populatedSubCategory = await SubCategory.findById(savedSubCategory._id)
      .populate('category', 'name');

    res.status(201).json(populatedSubCategory);
  } catch (err) {
    console.error('Error creating subcategory:', err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

// Update subcategory (name/status)
router.patch('/:id', async (req, res) => {
  const { name, status } = req.body;

  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    if (name !== undefined) subCategory.name = name;
    if (status !== undefined) subCategory.status = status;

    const updatedSubCategory = await subCategory.save();
    const populatedUpdated = await updatedSubCategory.populate("category", "name");

    res.json(populatedUpdated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// Delete subcategory
router.delete('/:id', async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    await SubCategory.findByIdAndDelete(req.params.id);
    res.json({ message: "SubCategory deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

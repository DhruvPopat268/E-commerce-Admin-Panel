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
// PATCH /api/subcategories/:id
router.patch('/:id', upload.single('image'), async (req, res) => {
  const { categoryId, name, status } = req.body;
  const imageFile = req.file;

  try {
    const updateData = {};

    if (categoryId) updateData.category = categoryId;
    if (name) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (imageFile) {
      updateData.image = `/uploads/${imageFile.filename}`;
      // Or Cloudinary upload, if applicable
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category', 'name');

    if (!updatedSubCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    res.json(updatedSubCategory);
  } catch (err) {
    console.error('Error updating subcategory:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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

const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');

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
router.post('/', async (req, res) => {
    const { categoryId, name, status } = req.body;

    if (!categoryId || !name) {
        return res.status(400).json({ message: "Category and name are required" });
    }

    try {
        const subCategory = new SubCategory({
            category: categoryId,
            name,
            status: status !== undefined ? status : true,
        });

        // Save the new sub-category
        const savedSubCategory = await subCategory.save();

        // ✅ Find it again and populate the category's name
        const populatedSubCategory = await SubCategory.findById(savedSubCategory._id)
            .populate('category', 'name');

        res.status(201).json(populatedSubCategory);
    } catch (err) {
        res.status(500).json({ message: err.message });
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

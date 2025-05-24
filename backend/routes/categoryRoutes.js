const express = require('express');
const multer = require('multer');
const path = require('path');
const Category = require('../models/category');

const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// POST create category with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // const { name, status } = req.body;
    // let imageUrl = "";

    // if (req.file) {
    //   imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    // }

    // const category = new Category({
    //   name,
    //   image: imageUrl,
    //   status: status === 'true',
    // });

    // await category.save();

    // res.status(201).json(category);
    const category = new Category(req.body)
    await category.save()
    res.status(201).json(category);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Example using Express.js
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// PUT /api/categories/:id
router.put('/:id', upload.single('image'), async (req, res) => {
  const { name, status } = req.body;
  const updateData = { name, status };

  if (req.file) {
    updateData.image = `/uploads/${req.file.filename}`; // or your actual image path logic
  }

  try {
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

module.exports = router;

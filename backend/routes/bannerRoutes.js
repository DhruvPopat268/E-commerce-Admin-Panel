const express = require('express');
const router = express.Router();
const multer = require('multer');
const Banner = require('../models/bannerModel');
const mongoose = require('mongoose');
const category = require('../models/category')
const SubCategory = require('../models/SubCategory')


// For image uploads - store in 'uploads/' folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage });


router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, type, categoryId, subcategoryId, status } = req.body;
    const imageFile = req.file;

    if (!title || !type || !imageFile) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Clean up categoryId and subcategoryId - convert empty strings to null
    const cleanCategoryId = categoryId && categoryId.trim() !== "" ? categoryId : null;
    const cleanSubcategoryId = subcategoryId && subcategoryId.trim() !== "" ? subcategoryId : null;

    // Optionally validate ObjectId format:
    if (cleanCategoryId && !mongoose.Types.ObjectId.isValid(cleanCategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid categoryId" });
    }
    if (cleanSubcategoryId && !mongoose.Types.ObjectId.isValid(cleanSubcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid subcategoryId" });
    }

    const bannerData = {
      title,
      type,
      categoryId: cleanCategoryId,
      subcategoryId: cleanSubcategoryId,
      status: status === "true",
      // Store the filename that will be served by the static middleware
      image: imageFile.filename, // Changed from originalname to filename
    };

    const newBanner = await Banner.create(bannerData);

    return res.status(201).json({ success: true, data: newBanner });
  } catch (error) {
    console.error("Error creating banner:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


// GET: Fetch all banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ createdAt: -1 })
      .populate('categoryId', 'name')    // Only fetch the 'name' field from Category
      .populate('subcategoryId', 'name'); // Only fetch the 'name' field from Subcategory

    // Add full image URL to each banner
    const bannersWithImageUrl = banners.map(banner => ({
      ...banner.toObject(),
      imageUrl: banner.image ? `/uploads/${banner.image}` : null
    }));

    res.status(200).json(bannersWithImageUrl);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
});

// PUT: Toggle status
router.put('/toggle/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ error: 'Banner not found' });

        banner.status = !banner.status;
        await banner.save();
        res.json(banner);
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
});

// PUT: Edit banner
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid banner ID' });
    }

    // Extract fields from req.body
    const { title, type, categoryId, subcategoryId, status } = req.body;

    const updatedData = {
      title,
      type,
      status: status === 'true',
    };

    // Only include categoryId if it exists and is a valid ObjectId
    // Also check that it's not an empty string or just whitespace
    if (categoryId && categoryId.trim() !== '' && mongoose.Types.ObjectId.isValid(categoryId)) {
      updatedData.categoryId = categoryId;
    } else if (categoryId === '' || categoryId === null || categoryId === undefined) {
      // If categoryId is explicitly empty, set it to null to clear the field
      updatedData.categoryId = null;
    }

    // Only include subcategoryId if it exists and is a valid ObjectId
    // Also check that it's not an empty string or just whitespace
    if (subcategoryId && subcategoryId.trim() !== '' && mongoose.Types.ObjectId.isValid(subcategoryId)) {
      updatedData.subcategoryId = subcategoryId;
    } else if (subcategoryId === '' || subcategoryId === null || subcategoryId === undefined) {
      // If subcategoryId is explicitly empty, set it to null to clear the field
      updatedData.subcategoryId = null;
    }

    // Handle file upload
    if (req.file) {
      // Store only the filename, not the full path
      updatedData.image = req.file.filename;
    }

    const banner = await Banner.findByIdAndUpdate(id, updatedData, { new: true });

    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    res.json(banner);
  } catch (err) {
    console.error('Update banner error:', err);
    res.status(500).json({ error: err.message });
  }
});


// DELETE: Delete banner


// Fixed delete route with better error handling
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Attempting to delete banner with ID:', id);
        
        // Validate the ID format first
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid ObjectId format:', id);
            return res.status(400).json({
                success: false,
                error: 'Invalid banner ID format'
            });
        }
        
        // Check if banner exists first
        const existingBanner = await Banner.findById(id);
        if (!existingBanner) {
            console.log('Banner not found with ID:', id);
            return res.status(404).json({
                success: false,
                error: 'Banner not found'
            });
        }
        
        console.log('Found banner to delete:', existingBanner.title);
        
        // Delete the banner
        const deletedBanner = await Banner.findByIdAndDelete(id);
        
        if (!deletedBanner) {
            console.log('Failed to delete banner with ID:', id);
            return res.status(404).json({
                success: false,
                error: 'Banner not found or already deleted'
            });
        }
        
        console.log('Successfully deleted banner:', deletedBanner.title);
        
        res.json({
            success: true,
            message: 'Banner deleted successfully',
            data: deletedBanner
        });
        
    } catch (err) {
        console.error('Delete error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        
        res.status(500).json({
            success: false,
            error: 'Server error during deletion',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});


module.exports = router;
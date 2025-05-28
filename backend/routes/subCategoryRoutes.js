const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./uploads");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'subcategories', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // Optional: resize images
      { quality: 'auto' } // Optional: optimize quality
    ]
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST Route - Create SubCategory
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { categoryId, name, status } = req.body;
    const imageFile = req.file;
    
    if (!categoryId || !name) {
      return res.status(400).json({ 
        error: "categoryId and name are required" 
      });
    }

    if (!imageFile) {
      return res.status(400).json({ 
        error: "Image is required" 
      });
    }

    // Prepare new subcategory object
    const newSubCategory = new SubCategory({
      category: categoryId,
      name,
      status: status === "true" || status === true, // convert string "true"/"false" to boolean
      image: imageFile.path // Store full Cloudinary URL
    });

    // Save to DB
    const savedSubCategory = await newSubCategory.save();
    
    // Optionally populate category for frontend use
    await savedSubCategory.populate("category");
    
    res.status(201).json(savedSubCategory);
  } catch (error) {
    console.error("Error creating subcategory:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT Route - Update SubCategory
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { categoryId, name, status } = req.body;
    const imageFile = req.file;
    
    const updateData = {};
    if (categoryId) updateData.category = categoryId;
    if (name) updateData.name = name;
    if (status !== undefined) updateData.status = status === "true" || status === true;
    
    // Handle image update with Cloudinary cleanup
    if (imageFile) {
      // Get the old subcategory to delete old image from Cloudinary
      const oldSubCategory = await SubCategory.findById(req.params.id);
      
      // Delete old image from Cloudinary if it exists
      if (oldSubCategory && oldSubCategory.image) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = oldSubCategory.image
            .split('/')
            .slice(-2) // Get last two parts: folder/filename
            .join('/')
            .split('.')[0]; // Remove file extension
          
          await cloudinary.uploader.destroy(publicId);
          console.log('Old subcategory image deleted from Cloudinary:', publicId);
        } catch (deleteError) {
          console.error('Error deleting old subcategory image from Cloudinary:', deleteError);
          // Continue with update even if old image deletion fails
        }
      }
      
      // Store the new Cloudinary URL
      updateData.image = imageFile.path;
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category', 'name');

    if (!updatedSubCategory) {
      return res.status(404).json({ 
        message: 'Subcategory not found' 
      });
    }

    res.json(updatedSubCategory);
  } catch (err) {
    console.error('Error updating subcategory:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// DELETE Route - Delete SubCategory
router.delete('/:id', async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    
    if (!subCategory) {
      return res.status(404).json({ 
        message: "SubCategory not found" 
      });
    }

    // Delete image from Cloudinary if it exists
    if (subCategory.image) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = subCategory.image
          .split('/')
          .slice(-2) // Get last two parts: folder/filename
          .join('/')
          .split('.')[0]; // Remove file extension
        
        await cloudinary.uploader.destroy(publicId);
        console.log('SubCategory image deleted from Cloudinary:', publicId);
      } catch (deleteError) {
        console.error('Error deleting subcategory image from Cloudinary:', deleteError);
        // Continue with subcategory deletion even if image deletion fails
      }
    }

    // Delete the subcategory from database
    await SubCategory.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: "SubCategory deleted successfully",
      success: true 
    });
  } catch (err) {
    console.error('Error deleting subcategory:', err);
    res.status(500).json({ 
      message: err.message,
      success: false 
    });
  }
});


// router.post('/', upload.single('image'), async (req, res) => {
//   try {
//     const { categoryId, name, status } = req.body
//     const imageUrl = req.file.filename

//     if (!categoryId || !name) {
//       return res.status(400).json({ error: "categoryId and name are required" })
//     }

//     // Prepare new subcategory object
//     const newSubCategory = new SubCategory({
//       category: categoryId,
//       name,
//       status: status === "true" || status === true, // convert string "true"/"false" to boolean
//       image: imageUrl
//     })

//     // Save to DB
//     const savedSubCategory = await newSubCategory.save()

//     // Optionally populate category for frontend use
//    await savedSubCategory.populate("category")

//     res.status(201).json(savedSubCategory)
//   } catch (error) {
//     console.error("Error creating subcategory:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

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
// put /api/subcategories/:id

// router.put('/:id', upload.single('image'), async (req, res) => {
//   const { categoryId, name, status } = req.body;
//   const imageFile = req.file;

//   try {
//     const updateData = {};

//     if (categoryId) updateData.category = categoryId;
//     if (name) updateData.name = name;
//     if (status !== undefined) updateData.status = status;
//     if (imageFile) {
//       updateData.image = imageFile.filename;
//       // Or Cloudinary upload, if applicable
//     }

//     const updatedSubCategory = await SubCategory.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true }
//     ).populate('category', 'name');

//     if (!updatedSubCategory) {
//       return res.status(404).json({ message: 'Subcategory not found' });
//     }

//     res.json(updatedSubCategory);
//   } catch (err) {
//     console.error('Error updating subcategory:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });

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
// router.delete('/:id', async (req, res) => {
//   try {
//     const subCategory = await SubCategory.findById(req.params.id);
//     if (!subCategory) {
//       return res.status(404).json({ message: "SubCategory not found" });
//     }

//     await SubCategory.findByIdAndDelete(req.params.id);
//     res.json({ message: "SubCategory deleted" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });


module.exports = router;

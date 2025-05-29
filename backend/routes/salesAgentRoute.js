const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const SalesAgent = require('../models/salesAgent');
const jwt = require('jsonwebtoken');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffer, folder = 'sales-agents') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "Sales Agent",
        transformation: [
          { width: 300, height: 300, crop: 'fill', quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

// GET all sales agents with search functionality
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query object
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status if provided
    if (status !== undefined) {
      query.status = status === 'true';
    }
    
    const salesAgents = await SalesAgent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await SalesAgent.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: salesAgents,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: salesAgents.length,
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales agents',
      error: error.message
    });
  }
});

// GET single sales agent by ID
router.get('/:id', async (req, res) => {
  try {
    const salesAgent = await SalesAgent.findById(req.params.id);
    
    if (!salesAgent) {
      return res.status(404).json({
        success: false,
        message: 'Sales agent not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: salesAgent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales agent',
      error: error.message
    });
  }
});

// POST create new sales agent
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { name, businessName, mobileNumber, address, village } = req.body;
    
    // Validate required fields
    if (!name || !businessName || !mobileNumber || !address || !village) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, businessName, mobileNumber, address, village) are required'
      });
    }
    
    // Check if mobile number already exists
    const existingAgent = await SalesAgent.findOne({ mobileNumber });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'Sales agent with this mobile number already exists'
      });
    }
    
    let photoData = {};
    
    // Handle photo upload if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        photoData = {
          public_id: result.public_id,
          url: result.secure_url
        };
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }
    
    // Create new sales agent
    const newSalesAgent = new SalesAgent({
      name,
      businessName,
      mobileNumber,
      address,
      village,
      photo: photoData,
      status: false // Default status is false for new agents
    });
    
    const savedAgent = await newSalesAgent.save();
    
    res.status(200).json({
      success: true,
      message: 'Sales agent created successfully',
      data: savedAgent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating sales agent',
      error: error.message
    });
  }
});



router.post('/login', async (req, res) => {
  try {
    const { mobileNumber, MobileNumber } = req.body;
    
    // Handle both possible key formats
    const mobile = mobileNumber || MobileNumber;
    
    // Validate mobile number is provided
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }
    
    // Check if sales agent exists with this mobile number
    const salesAgent = await SalesAgent.findOne({ mobileNumber: mobile });
    
    if (!salesAgent) {
      return res.status(404).json({
        success: false,
        message: 'Mobile number does not exist'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: salesAgent._id,
        mobileNumber: mobile,
        name: salesAgent.name,
        businessName: salesAgent.businessName
      },
      process.env.JWT_SECRET || 'your-secret-key', // Make sure to use environment variable
      { 
        expiresIn: '30d' // Token expires in 30 days
      }
    );
    
    // Return success response with token and status
    res.status(200).json({
      success: true,
      message: 'Login Successfully',
      token,
      status: salesAgent.status,
      data: {
        id: salesAgent._id,
        name: salesAgent.name,
        businessName: salesAgent.businessName,
        mobileNumber: salesAgent.mobileNumber,
        village: salesAgent.village,
        status: salesAgent.status,
        address : salesAgent.address,
        photo: salesAgent.photo
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Optional: Middleware to verify JWT token for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// PUT update sales agent
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const { name, businessName, mobileNumber, address, village } = req.body;
    const agentId = req.params.id;
    
    // Find existing agent
    const existingAgent = await SalesAgent.findById(agentId);
    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: 'Sales agent not found'
      });
    }
    
    // Check if mobile number is being changed and if it already exists
    if (mobileNumber && mobileNumber !== existingAgent.mobileNumber) {
      const duplicateAgent = await SalesAgent.findOne({ 
        mobileNumber, 
        _id: { $ne: agentId } 
      });
      if (duplicateAgent) {
        return res.status(400).json({
          success: false,
          message: 'Sales agent with this mobile number already exists'
        });
      }
    }
    
    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(businessName && { businessName }),
      ...(mobileNumber && { mobileNumber }),
      ...(address && { address }),
      ...(village && { village })
    };
    
    // Handle photo upload if new photo is provided
    if (req.file) {
      try {
        // Delete old image from Cloudinary if exists
        if (existingAgent.photo && existingAgent.photo.public_id) {
          await deleteFromCloudinary(existingAgent.photo.public_id);
        }
        
        // Upload new image
        const result = await uploadToCloudinary(req.file.buffer);
        updateData.photo = {
          public_id: result.public_id,
          url: result.secure_url
        };
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }
    
    // Update agent
    const updatedAgent = await SalesAgent.findByIdAndUpdate(
      agentId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Sales agent updated successfully',
      data: updatedAgent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating sales agent',
      error: error.message
    });
  }
});

// PUT update sales agent status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const agentId = req.params.id;
    
    // Validate status value
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Status must be a boolean value (true or false)'
      });
    }
    
    // Find and update the agent's status
    const updatedAgent = await SalesAgent.findByIdAndUpdate(
      agentId,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!updatedAgent) {
      return res.status(404).json({
        success: false,
        message: 'Sales agent not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Sales agent status ${status ? 'activated' : 'deactivated'} successfully`,
      data: updatedAgent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating sales agent status',
      error: error.message
    });
  }
});

// DELETE sales agent
router.delete('/:id', async (req, res) => {
  try {
    const agentId = req.params.id;
    
    // Find the agent to get photo info before deletion
    const agent = await SalesAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Sales agent not found'
      });
    }
    
    // Delete image from Cloudinary if exists
    if (agent.photo && agent.photo.public_id) {
      await deleteFromCloudinary(agent.photo.public_id);
    }
    
    // Delete agent from database
    await SalesAgent.findByIdAndDelete(agentId);
    
    res.status(200).json({
      success: true,
      message: 'Sales agent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sales agent',
      error: error.message
    });
  }
});

// GET sales agents statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalAgents = await SalesAgent.countDocuments();
    const activeAgents = await SalesAgent.countDocuments({ status: true });
    const inactiveAgents = await SalesAgent.countDocuments({ status: false });
    
    res.status(200).json({
      success: true,
      data: {
        total: totalAgents,
        active: activeAgents,
        inactive: inactiveAgents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
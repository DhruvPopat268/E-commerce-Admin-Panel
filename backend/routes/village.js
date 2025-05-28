const express = require('express');
const router = express.Router();
const Village = require('../models/village'); // Adjust path as needed

// GET - Get all villages
router.get('/', async (req, res) => {
  try {
    const villages = await Village.find().sort({ createdAt: -1 });
    
    // Format the response to match your frontend structure
    const formattedVillages = villages.map((village, index) => ({
      id: village._id,
      name: village.name,
      villageCode: village.villageCode, // Include village code
      status: village.status,
      createdAt: village.createdAt.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }));

    res.status(200).json({
      success: true,
      count: villages.length,
      data: formattedVillages
    });
  } catch (error) {
    console.error('Error fetching villages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// POST - Create a new village
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Village name is required'
      });
    }

    // Check if village already exists
    const existingVillage = await Village.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (existingVillage) {
      return res.status(400).json({
        success: false,
        message: 'Village with this name already exists'
      });
    }

    // Generate unique village code
    const villageCode = await Village.generateUniqueVillageCode(name.trim());

    // Create new village
    const village = new Village({
      name: name.trim(),
      villageCode: villageCode,
      status: true
    });

    const savedVillage = await village.save();

    // Format response to match frontend structure
    const formattedVillage = {
      id: savedVillage._id,
      name: savedVillage.name,
      villageCode: savedVillage.villageCode,
      status: savedVillage.status,
      createdAt: savedVillage.createdAt.toISOString().split('T')[0]
    };

    res.status(201).json({
      success: true,
      message: 'Village created successfully',
      data: formattedVillage
    });
  } catch (error) {
    console.error('Error creating village:', error);
    
    if (error.code === 11000) {
      // Check if the duplicate is for name or villageCode
      if (error.keyPattern && error.keyPattern.name) {
        return res.status(400).json({
          success: false,
          message: 'Village with this name already exists'
        });
      } else if (error.keyPattern && error.keyPattern.villageCode) {
        return res.status(400).json({
          success: false,
          message: 'Village code conflict occurred. Please try again.'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// PUT - Update village (complete update)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Village name is required'
      });
    }

    // Get current village to check if name is changing
    const currentVillage = await Village.findById(id);
    if (!currentVillage) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    // Check if another village with the same name exists
    const existingVillage = await Village.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingVillage) {
      return res.status(400).json({
        success: false,
        message: 'Village with this name already exists'
      });
    }

    // Generate new village code if name is changing
    let updateData = {
      name: name.trim(),
      status: status !== undefined ? status : true,
      updatedAt: Date.now()
    };

    // If name is changing, generate new village code
    if (currentVillage.name.toLowerCase() !== name.trim().toLowerCase()) {
      const newVillageCode = await Village.generateUniqueVillageCode(name.trim());
      updateData.villageCode = newVillageCode;
    }

    const updatedVillage = await Village.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    // Format response
    const formattedVillage = {
      id: updatedVillage._id,
      name: updatedVillage.name,
      villageCode: updatedVillage.villageCode,
      status: updatedVillage.status,
      createdAt: updatedVillage.createdAt.toISOString().split('T')[0]
    };

    res.status(200).json({
      success: true,
      message: 'Village updated successfully',
      data: formattedVillage
    });
  } catch (error) {
    console.error('Error updating village:', error);
    
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.name) {
        return res.status(400).json({
          success: false,
          message: 'Village with this name already exists'
        });
      } else if (error.keyPattern && error.keyPattern.villageCode) {
        return res.status(400).json({
          success: false,
          message: 'Village code conflict occurred. Please try again.'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// PATCH - Update village status only
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Status must be a boolean value'
      });
    }

    const updatedVillage = await Village.findByIdAndUpdate(
      id,
      {
        status: status,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedVillage) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    // Format response
    const formattedVillage = {
      id: updatedVillage._id,
      name: updatedVillage.name,
      villageCode: updatedVillage.villageCode,
      status: updatedVillage.status,
      createdAt: updatedVillage.createdAt.toISOString().split('T')[0]
    };

    res.status(200).json({
      success: true,
      message: `Village ${status ? 'activated' : 'deactivated'} successfully`,
      data: formattedVillage
    });
  } catch (error) {
    console.error('Error updating village status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// DELETE - Delete village
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedVillage = await Village.findByIdAndDelete(id);

    if (!deletedVillage) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Village deleted successfully',
      data: {
        id: deletedVillage._id,
        name: deletedVillage.name,
        villageCode: deletedVillage.villageCode
      }
    });
  } catch (error) {
    console.error('Error deleting village:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// GET - Get single village by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const village = await Village.findById(id);

    if (!village) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    // Format response
    const formattedVillage = {
      id: village._id,
      name: village.name,
      villageCode: village.villageCode,
      status: village.status,
      createdAt: village.createdAt.toISOString().split('T')[0]
    };

    res.status(200).json({
      success: true,
      data: formattedVillage
    });
  } catch (error) {
    console.error('Error fetching village:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = router;
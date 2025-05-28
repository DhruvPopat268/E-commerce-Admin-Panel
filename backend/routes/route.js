const express = require('express');
const router = express.Router();
const Route = require('../models/route');

// GET /api/routes - Get all routes
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Build query object
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    
    const routes = await Route.find(query).sort({ createdAt: -1 });
    
    // Format response to match frontend expectations
    const formattedRoutes = routes.map(route => ({
      id: route._id,
      name: route.name,
      status: route.status,
      createdAt: route.formattedCreatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: formattedRoutes.length,
      data: formattedRoutes
    });
    
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching routes',
      error: error.message
    });
  }
});

// POST /api/routes - Create new route
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Route name is required'
      });
    }
    
    // Check if route with same name already exists
    const existingRoute = await Route.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' } 
    });
    
    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: 'Route with this name already exists'
      });
    }
    
    // Create new route
    const newRoute = new Route({
      name: name.trim(),
      status: true
    });
    
    const savedRoute = await newRoute.save();
    
    // Format response
    const formattedRoute = {
      id: savedRoute._id,
      name: savedRoute.name,
      status: savedRoute.status,
      createdAt: savedRoute.formattedCreatedAt
    };
    
    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: formattedRoute
    });
    
  } catch (error) {
    console.error('Error creating route:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating route',
      error: error.message
    });
  }
});

// DELETE /api/routes/:id - Delete route
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format'
      });
    }
    
    const deletedRoute = await Route.findByIdAndDelete(id);
    
    if (!deletedRoute) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Route deleted successfully',
      data: {
        id: deletedRoute._id,
        name: deletedRoute.name
      }
    });
    
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting route',
      error: error.message
    });
  }
});

// PUT /api/routes/:id/status - Toggle route status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format'
      });
    }
    
    const route = await Route.findById(id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    // Toggle status
    route.status = !route.status;
    const updatedRoute = await route.save();
    
    // Format response
    const formattedRoute = {
      id: updatedRoute._id,
      name: updatedRoute.name,
      status: updatedRoute.status,
      createdAt: updatedRoute.formattedCreatedAt
    };
    
    res.status(200).json({
      success: true,
      message: 'Route status updated successfully',
      data: formattedRoute
    });
    
  } catch (error) {
    console.error('Error updating route status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating route status',
      error: error.message
    });
  }
});

module.exports = router;
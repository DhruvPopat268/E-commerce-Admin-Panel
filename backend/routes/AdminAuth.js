const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const verifyToken = require('../middleware/verifyToken')
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET// You can use .env

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ mobileNumber });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = await Admin.create({ mobileNumber, password: hashedPassword });

    res.status(200).json({
      message: "Admin SignUp Successfully"
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    
    // Find admin
    const admin = await Admin.findOne({ mobileNumber });
    if (!admin) return res.status(400).json({ message: 'Invalid mobileNumber or password' });
    
    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid mobileNumber or password' });
    
    // Generate token
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('Generated token:', token);
    
    // Get the origin from the request
    const origin = req.headers.origin;
    console.log('Request origin:', origin);
    
    // Determine if it's localhost or production
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    const isProduction = process.env.NODE_ENV === 'production' && !isLocalhost;
    
    console.log('Is production:', isProduction);
    console.log('Is localhost:', isLocalhost);
    
    // Set cookie with correct settings for both localhost and production
    res.cookie('token', token, {
      httpOnly: false, // Change to false temporarily for debugging
      secure: isProduction, // Only secure in production
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/', // Available for all paths
      domain: isProduction ? '.vercel.app' : undefined // Set domain for production
    });
    
    console.log('Cookie set with settings:', {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? '.vercel.app' : undefined
    });
    
    res.status(200).json({
      message: 'Login successful',
      token, // Also send token in response for debugging
      admin: {
        id: admin._id,
        mobileNumber: admin.mobileNumber,
      },
    });
  } catch (err) {
    console.log('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
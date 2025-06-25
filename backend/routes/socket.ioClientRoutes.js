const express = require('express');
const { io } = require('socket.io-client');

const router = express.Router();

// Socket.IO client connection to printing server
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 5
});

// Socket connection events
socket.on('connect', () => {
  console.log('Connected to printing server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from printing server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error to printing server:', error);
});

// Listen for print responses
socket.on('print-success', (data) => {
  console.log('Print successful for order:', data.orderId);
  // You can store this response in database or handle as needed
});

socket.on('print-error', (data) => {
  console.error('Print failed for order:', data.orderId, 'Error:', data.error);
  // You can store this error in database or handle as needed
});

// POST endpoint to send print data to printing server
router.post('/send-to-print', async (req, res) => {
  try {
    // Accept the full response from place order API
    const requestData = req.body;
    
    // Extract data from the place order response structure
    const order = requestData.order;
    const salesAgentName = requestData.salesAgentName;
    const salesAgentMobile = requestData.salesAgentMobile;
    const villageName = requestData.villageName;

    // Validate required data
    if (!order || !order.orders || !Array.isArray(order.orders)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data. Order and orders array are required.'
      });
    }

    if (!salesAgentName || !salesAgentMobile || !villageName) {
      return res.status(400).json({
        success: false,
        message: 'Sales agent information is required (salesAgentName, salesAgentMobile, villageName).'
      });
    }

    // Check if socket is connected
    if (!socket.connected) {
      return res.status(503).json({
        success: false,
        message: 'Printing server is not connected. Please try again later.'
      });
    }

    // Send data to printing server via Socket.IO
    socket.emit('print-invoice', {
      order,
      salesAgentName,
      salesAgentMobile,
      villageName
    });

    console.log('Print request sent for order:', order._id);

    res.json({
      success: true,
      message: 'Print request sent to printing server successfully',
      orderId: order._id,
      status: requestData.status
    });

  } catch (error) {
    console.error('Error sending print request:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending print request',
      error: error.message
    });
  }
});

// GET endpoint to check printing server connection status
router.get('/print-status', (req, res) => {
  res.json({
    connected: socket.connected,
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
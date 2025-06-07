const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const SalesAgent = require('../models/salesAgent');
const verifyToken = require('../middleware/authMiddleware');
const RouteSetup = require('../models/routeSetup');
const Route = require('../models/route');
const mongoose = require('mongoose')
const Village = require('../models/village')
const jwt = require('jsonwebtoken')
const PDFDocument = require('pdfkit');
const printer = require('pdf-to-printer');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const puppeteer = require('puppeteer');



// Place order
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const cartItems = await Cart.find({ userId });
   
    if (!cartItems.length) {
      return res.status(400).json({ message: 'No items in cart to place order' });
    }
    
    const orderItems = cartItems.map(item => ({
      productId: item.productId?.toString(),
      productName: item.productName,
      image: item.image,
      quantity: item.quantity || 1,
      price: item.price || 0,
      attributes: item.attributes,
    }));
    
    const newOrder = new Order({
      userId,
      orders: orderItems,
      status: 'pending',
    });
    await newOrder.save();
    await Cart.deleteMany({ userId });
    
    // Get customer/sales agent details for invoice
    const customerData = await SalesAgent.findById(userId).select('name mobile village route');
    
    // Get Socket.IO instance and print clients from app
    const io = req.app.get('io');
    const printClients = req.app.get('printClients');
    
    // Generate PDF buffer (you'll need to implement this function)
    const pdfBuffer = await generateInvoicePDF(newOrder, customerData);
    
    // Prepare print data - FIXED: Use correct event name and include pdfBuffer
    const printData = {
      orderId: newOrder._id,
      orderData: newOrder,
      customerData: customerData,
      pdfBuffer: pdfBuffer, // Required by your client
      timestamp: new Date()
    };
    
    // Send print command to all connected print clients
    // FIXED: Use the correct event name that matches your client
    if (printClients.size > 0) {
      io.emit('print-pdf-invoice', printData); // Changed from 'print-invoice'
      console.log(`📄 Invoice sent to ${printClients.size} print client(s) for Order: ${newOrder._id}`);
    } else {
      console.log(`⚠️  No print clients connected - Order ${newOrder._id} placed but not printed`);
    }
    
    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder,
      printStatus: printClients.size > 0 ? 'Invoice sent to printer' : 'No printer connected'
    });
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ message: 'Error placing order' });
  }
});

// Helper function to generate PDF (you need to implement this)
async function generateInvoicePDF(orderData, customerData) {
  // You can use libraries like:
  // - puppeteer (for HTML to PDF)
  // - pdfkit (for programmatic PDF creation)
  // - jsPDF (lightweight PDF generation)
  
  // Example with puppeteer:
  
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Generate HTML content for invoice
    const htmlContent = generateInvoiceHTML(orderData, customerData);
    
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    
    await browser.close();
    return pdfBuffer;
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

function generateInvoiceHTML(orderData, customerData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - Order ${orderData._id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        .customer-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INVOICE</h1>
        <p>Order ID: ${orderData._id}</p>
        <p>Date: ${new Date(orderData.createdAt).toLocaleDateString()}</p>
      </div>
      
      <div class="customer-info">
        <h3>Customer Details:</h3>
        <p><strong>Name:</strong> ${customerData?.name || 'N/A'}</p>
        <p><strong>Mobile:</strong> ${customerData?.mobile || 'N/A'}</p>
        <p><strong>Village:</strong> ${customerData?.village || 'N/A'}</p>
        <p><strong>Route:</strong> ${customerData?.route || 'N/A'}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.orders.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>₹${item.price}</td>
              <td>₹${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total">
            <td colspan="3">Total Amount:</td>
            <td>₹${orderData.orders.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;
}

router.get('/all', async (req, res) => {
  try {
    // Fetch all orders
    const rawOrders = await Order.find().sort({ createdAt: -1 });

    // Get unique user IDs from orders
    const userIds = [...new Set(rawOrders.map(order => order.userId?.toString()))];


    // Fetch sales agents for these user IDs
    const agents = await SalesAgent.find({ _id: { $in: userIds } }).lean();


    // Create agent map for quick lookup
    const agentMap = new Map(agents.map(agent => [agent._id.toString(), agent]));

    // Extract valid village IDs from agents
    const validVillageIds = agents
      .map(agent => agent.village?.toString())
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));



    // Fetch village details
    const villages = await Village.find({ _id: { $in: validVillageIds } }).lean();
    const villageMap = new Map(villages.map(v => [v._id.toString(), v.name]));


    // Fetch route setups that contain any of our village IDs
    const routeSetups = await RouteSetup.find({
      'villages.villageId': {
        $in: validVillageIds.map(id => new mongoose.Types.ObjectId(id))
      }
    }).lean();



    // Create village to route mapping
    const villageToRouteMap = new Map();
    for (const setup of routeSetups) {
      const routeId = setup.routeId?.toString(); // Fixed: should be routeId, not routed


      if (routeId && setup.villages && Array.isArray(setup.villages)) {
        for (const village of setup.villages) {
          const villageId = village.villageId?.toString();
          if (villageId) {
            villageToRouteMap.set(villageId, routeId);

          }
        }
      }
    }

    // Get unique route IDs
    const routeIds = [...new Set([...villageToRouteMap.values()].filter(Boolean))];


    // Fetch route details
    const routes = await Route.find({ _id: { $in: routeIds } }).lean();
    const routeMap = new Map(routes.map(route => [route._id.toString(), route.name]));


    // Process orders with all details
    const ordersWithDetails = rawOrders.map(order => {
      // Calculate cart total
      const cartTotal = order.orders.reduce(
        (sum, item) => sum + (item.attributes?.total || 0),
        0
      );

      // Get agent details
      const agent = agentMap.get(order.userId?.toString());
      const villageId = agent?.village?.toString();
      const villageName = villageMap.get(villageId) || 'Unknown';

      // Get route details
      const routeId = villageToRouteMap.get(villageId);
      const routeName = routeMap.get(routeId) || 'Unknown';

      // Debug logging for troubleshooting
      if (routeName === 'Unknown') {
        console.warn(`⚠️ Route lookup failed:`, {
          orderId: order._id.toString(),
          userId: order.userId?.toString(),
          agentFound: !!agent,
          villageId: villageId,
          villageName: villageName,
          routeId: routeId,
          routeFound: routeId ? routeMap.has(routeId) : false
        });
      }

      return {
        ...order._doc,
        cartTotal,
        salesAgentName: agent?.name || 'Unknown',
        salesAgentMobile: agent?.mobileNumber || 'N/A',
        villageName,
        routeName,
      };
    });

    res.status(200).json({
      message: 'All orders fetched successfully',
      orders: ordersWithDetails,
    });

  } catch (error) {
    console.error('❌ Error in /all route:', error);
    res.status(500).json({ message: 'Error fetching all orders' });
  }
});

// backend route: GET /api/orders/:id

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    console.log(err)
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ----------------------------------------------->>> orderId for admin 

router.get('/printer/:orderId', async (req, res) => {

  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get agent info
    const agent = await SalesAgent.findById(order.userId).lean();
    const villageId = agent?.village?.toString();

    // Get village name
    const village = villageId && mongoose.Types.ObjectId.isValid(villageId)
      ? await Village.findById(villageId).lean()
      : null;

    // Find route setup that includes the village
    const routeSetup = villageId
      ? await RouteSetup.findOne({ 'villages.villageId': new mongoose.Types.ObjectId(villageId) }).lean()
      : null;

    const routeId = routeSetup?.routeId?.toString();
    const route = routeId ? await Route.findById(routeId).lean() : null;

    // Calculate cart total
    const cartTotal = order.orders.reduce(
      (sum, item) => sum + (item.attributes?.total || 0),
      0
    );

    // Build response
    const orderWithDetails = {
      ...order._doc,
      cartTotal,
      salesAgentName: agent?.name || 'Unknown',
      salesAgentMobile: agent?.mobileNumber || 'N/A',
      villageName: village?.name || 'Unknown',
      routeName: route?.name || 'Unknown',
    };

    res.status(200).json({
      message: 'Order fetched successfully',
      order: orderWithDetails,
    });
  } catch (error) {
    console.error('❌ Error fetching specific order:', error);
    res.status(500).json({ message: 'Error fetching the order' });
  }
});

// Bulk confirm orders - NEW ROUTE
router.patch('/confirm-bulk', async (req, res) => {
  try {
    const { orderIds } = req.body;

    // Validate orderIds
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required and must not be empty' });
    }

    // Find orders first to check if they exist and are pending
    const existingOrders = await Order.find({
      _id: { $in: orderIds },
      status: 'pending'
    });

    if (existingOrders.length === 0) {
      return res.status(404).json({ message: 'No pending orders found with the provided IDs' });
    }

    // Update all found orders to confirmed status
    const updateResult = await Order.updateMany(
      {
        _id: { $in: existingOrders.map(order => order._id) },
        status: 'pending'
      },
      {
        status: 'confirmed',
        confirmedAt: new Date() // Optional: add confirmation timestamp
      }
    );

    // Get the updated orders to return in response
    const updatedOrders = await Order.find({
      _id: { $in: existingOrders.map(order => order._id) }
    });

    res.status(200).json({
      message: `${updateResult.modifiedCount} order(s) confirmed successfully`,
      confirmedCount: updateResult.modifiedCount,
      totalRequested: orderIds.length,
      orders: updatedOrders
    });

  } catch (error) {
    console.error('Error confirming bulk orders:', error);
    res.status(500).json({ message: 'Error confirming orders' });
  }
});

// Bulk mark orders as out for delivery
router.patch('/out-for-delivery-bulk', async (req, res) => {
  try {
    const { orderIds } = req.body;

    // Validate orderIds
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        message: 'Order IDs array is required and must not be empty'
      });
    }

    // Find orders first to check if they exist and are confirmed
    const existingOrders = await Order.find({
      _id: { $in: orderIds },
      status: 'confirmed'
    });

    if (existingOrders.length === 0) {
      return res.status(404).json({
        message: 'No confirmed orders found with the provided IDs'
      });
    }

    // Update all found orders to out for delivery status
    const updateResult = await Order.updateMany(
      {
        _id: { $in: existingOrders.map(order => order._id) },
        status: 'confirmed'
      },
      {
        status: 'out for delivery',
        outForDeliveryAt: new Date() // Optional: add timestamp
      }
    );

    // Get the updated orders to return in response
    const updatedOrders = await Order.find({
      _id: { $in: existingOrders.map(order => order._id) }
    });

    res.status(200).json({
      message: `${updateResult.modifiedCount} order(s) marked as out for delivery successfully`,
      outForDeliveryCount: updateResult.modifiedCount,
      totalRequested: orderIds.length,
      orders: updatedOrders
    });

  } catch (error) {
    console.error('Error marking bulk orders as out for delivery:', error);
    res.status(500).json({ message: 'Error marking orders as out for delivery' });
  }
});

// Bulk cancel orders route
router.patch('/cancel-bulk', async (req, res) => {
  try {
    const { orderIds } = req.body;

    // Validate orderIds
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        message: 'Order IDs array is required and must not be empty'
      });
    }

    // Find orders first to check if they exist and can be cancelled
    const existingOrders = await Order.find({
      _id: { $in: orderIds },
      status: { $in: ['pending', 'confirmed', 'out for delivery'] }
    });

    if (existingOrders.length === 0) {
      return res.status(404).json({
        message: 'No cancellable orders found with the provided IDs'
      });
    }

    // Update all found orders to cancelled status
    const updateResult = await Order.updateMany(
      {
        _id: { $in: existingOrders.map(order => order._id) },
        status: { $in: ['pending', 'confirmed', 'out for delivery'] }
      },
      {
        status: 'cancelled',
        cancelledAt: new Date() // Optional: add timestamp
      }
    );

    // Get the updated orders to return in response
    const updatedOrders = await Order.find({
      _id: { $in: existingOrders.map(order => order._id) }
    });

    res.status(200).json({
      message: `${updateResult.modifiedCount} order(s) cancelled successfully`,
      cancelledCount: updateResult.modifiedCount,
      totalRequested: orderIds.length,
      orders: updatedOrders
    });

  } catch (error) {
    console.error('Error cancelling bulk orders:', error);
    res.status(500).json({ message: 'Error cancelling orders' });
  }
});

router.patch('/delivered-bulk', async (req, res) => {
  try {
    const { orderIds } = req.body;

    // Validate orderIds
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        message: 'Order IDs array is required and must not be empty'
      });
    }

    // Find orders first to check if they exist and can be marked as delivered
    const existingOrders = await Order.find({
      _id: { $in: orderIds },
      status: 'out for delivery' // Only allow out for delivery orders to be marked as delivered
    });

    if (existingOrders.length === 0) {
      return res.status(404).json({
        message: 'No out for delivery orders found with the provided IDs'
      });
    }

    // Update all found orders to delivered status
    const updateResult = await Order.updateMany(
      {
        _id: { $in: existingOrders.map(order => order._id) },
        status: 'out for delivery'
      },
      {
        status: 'delivered',
        deliveredAt: new Date() // Optional: add timestamp
      }
    );

    // Get the updated orders to return in response
    const updatedOrders = await Order.find({
      _id: { $in: existingOrders.map(order => order._id) }
    });

    res.status(200).json({
      message: `${updateResult.modifiedCount} order(s) marked as delivered successfully`,
      deliveredCount: updateResult.modifiedCount,
      totalRequested: orderIds.length,
      orders: updatedOrders
    });

  } catch (error) {
    console.error('Error marking bulk orders as delivered:', error);
    res.status(500).json({ message: 'Error marking orders as delivered' });
  }
});

router.patch('/returned-bulk', async (req, res) => {
  try {
    const { orderIds } = req.body;

    // Validate orderIds
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        message: 'Order IDs array is required and must not be empty'
      });
    }

    // Find orders first to check if they exist and can be marked as returned
    const existingOrders = await Order.find({
      _id: { $in: orderIds },
      status: 'delivered' // Only allow delivered orders to be marked as returned
    });

    if (existingOrders.length === 0) {
      return res.status(404).json({
        message: 'No delivered orders found with the provided IDs'
      });
    }

    // Update all found orders to returned status
    const updateResult = await Order.updateMany(
      {
        _id: { $in: existingOrders.map(order => order._id) },
        status: 'delivered'
      },
      {
        status: 'returned',
        returnedAt: new Date() // Optional: add timestamp
      }
    );

    // Get the updated orders to return in response
    const updatedOrders = await Order.find({
      _id: { $in: existingOrders.map(order => order._id) }
    });

    res.status(200).json({
      message: `${updateResult.modifiedCount} order(s) marked as returned successfully`,
      returnedCount: updateResult.modifiedCount,
      totalRequested: orderIds.length,
      orders: updatedOrders
    });

  } catch (error) {
    console.error('Error marking bulk orders as returned:', error);
    res.status(500).json({ message: 'Error marking orders as returned' });
  }
});

router.post('/cancelled', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const cancelledOrders = await Order.find({ userId, status: 'cancelled' });

    if (!cancelledOrders.length) {
      return res.status(200).json({ cancelledOrders: [] });
    }

    // 👇 Transform the result to only return required fields
    const filteredOrders = cancelledOrders.map(order => ({
      _id: order._id,
      status: order.status,
      orderDate: order.orderDate,
      itemCount: order.orders.length
    }));

    res.status(200).json({ cancelledOrders: filteredOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching cancelled orders' });
  }
});

router.post('/active', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const activeStatuses = ['pending', 'confirmed', 'out for delivery'];

    const activeOrders = await Order.find({ userId, status: { $in: activeStatuses } });

    if (!activeOrders.length) {
      return res.status(200).json({ activeOrders: [] });
    }

    const filteredOrders = activeOrders.map(order => ({
      _id: order._id,
      status: order.status,
      orderDate: order.orderDate,
      itemCount: order.orders.length
    }));

    res.status(200).json({ activeOrders: filteredOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching active orders' });
  }
});

router.post('/delivered', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const deliveredOrders = await Order.find({ userId, status: 'delivered' });

    if (!deliveredOrders.length) {
      return res.status(200).json({ deliveredOrders: [] });
    }

    const filteredOrders = deliveredOrders.map(order => ({
      _id: order._id,
      status: order.status,
      orderDate: order.orderDate,
      itemCount: order.orders.length
    }));

    res.status(200).json({ deliveredOrders: filteredOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching delivered orders' });
  }
});

// ----------------------------------------------->>> for android 

router.post('/orderId', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get agent info
    const agent = await SalesAgent.findById(order.userId).lean();
    const villageId = agent?.village?.toString();

    // Get village name
    const village = villageId && mongoose.Types.ObjectId.isValid(villageId)
      ? await Village.findById(villageId).lean()
      : null;

    // Find route setup that includes the village
    const routeSetup = villageId
      ? await RouteSetup.findOne({ 'villages.villageId': new mongoose.Types.ObjectId(villageId) }).lean()
      : null;

    const routeId = routeSetup?.routeId?.toString();
    const route = routeId ? await Route.findById(routeId).lean() : null;

    // Calculate cart total
    const cartTotal = order.orders.reduce(
      (sum, item) => sum + (item.attributes?.total || 0),
      0
    );

    // Build response
    const orderWithDetails = {
      ...order._doc,
      cartTotal,
      salesAgentName: agent?.name || 'Unknown',
      salesAgentMobile: agent?.mobileNumber || 'N/A',
      villageName: village?.name || 'Unknown',
      routeName: route?.name || 'Unknown',
    };

    res.status(200).json({
      message: 'Order fetched successfully',
      order: orderWithDetails,
    });
  } catch (error) {
    console.error('❌ Error fetching specific order:', error);
    res.status(500).json({ message: 'Error fetching the order' });
  }
});

router.post('/orderId/cancel', verifyToken, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = req.userId; // Extracted from the token
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    // Find the order for this user
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found for this user' });
    }

    // Only allow cancellation if status is 'pending'
    if (order.status !== 'pending') {
      return res.status(400).json({ message: "You can't cancel this order" });
    }

    // Update the status to 'cancelled'
    order.status = 'cancelled';
    await order.save();

    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});



module.exports = router;
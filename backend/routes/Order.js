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

// Place order
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // userId from token

    console.log(userId)

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

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error placing order' });
  }
});
router.get('/all', async (req, res) => {
  try {
    // Fetch all orders
    const rawOrders = await Order.find().sort({ createdAt: -1 });
    
    // Get unique user IDs from orders
    const userIds = [...new Set(rawOrders.map(order => order.userId?.toString()))];
    console.log('📋 User IDs from orders:', userIds);
    
    // Fetch sales agents for these user IDs
    const agents = await SalesAgent.find({ _id: { $in: userIds } }).lean();
    console.log('👥 Sales Agents found:', agents.length);
    
    // Create agent map for quick lookup
    const agentMap = new Map(agents.map(agent => [agent._id.toString(), agent]));
    
    // Extract valid village IDs from agents
    const validVillageIds = agents
      .map(agent => agent.village?.toString())
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));
    
    console.log('🏘️ Valid Village IDs:', validVillageIds);
    
    // Fetch village details
    const villages = await Village.find({ _id: { $in: validVillageIds } }).lean();
    const villageMap = new Map(villages.map(v => [v._id.toString(), v.name]));
    console.log('🗺️ Village Map:', villageMap);
    
    // Fetch route setups that contain any of our village IDs
    const routeSetups = await RouteSetup.find({
      'villages.villageId': {
        $in: validVillageIds.map(id => new mongoose.Types.ObjectId(id))
      }
    }).lean();
    
    console.log('🛣️ Route Setups found:', routeSetups.length);
    console.log('🛣️ Route Setups details:', routeSetups);
    
    // Create village to route mapping
    const villageToRouteMap = new Map();
    for (const setup of routeSetups) {
      const routeId = setup.routeId?.toString(); // Fixed: should be routeId, not routed
      console.log('🔍 Processing setup with routeId:', routeId);
      
      if (routeId && setup.villages && Array.isArray(setup.villages)) {
        for (const village of setup.villages) {
          const villageId = village.villageId?.toString();
          if (villageId) {
            villageToRouteMap.set(villageId, routeId);
            console.log(`🔗 Mapped village ${villageId} to route ${routeId}`);
          }
        }
      }
    }
    
    console.log('🗂️ Village to Route Map:', Object.fromEntries(villageToRouteMap));
    
    // Get unique route IDs
    const routeIds = [...new Set([...villageToRouteMap.values()].filter(Boolean))];
    console.log('🆔 Route IDs to fetch:', routeIds);
    
    // Fetch route details
    const routes = await Route.find({ _id: { $in: routeIds } }).lean();
    const routeMap = new Map(routes.map(route => [route._id.toString(), route.name]));
    console.log('📍 Route Map:', Object.fromEntries(routeMap));
    
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

router.get('/:orderId', async (req, res) => {
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


// Confirm single order (keep for backward compatibility)
router.patch('/confirm', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: 'confirmed' },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order confirmed successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ message: 'Error confirming order' });
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

module.exports = router;
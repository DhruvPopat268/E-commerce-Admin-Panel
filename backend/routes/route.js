const express = require('express');
const router = express.Router();
const Route = require('../models/route');
const RouteSetup = require('../models/routeSetup')
const SalesAgent = require('../models/salesAgent'); // Adjust path as needed
const cron = require('node-cron');
const OneSignal = require('@onesignal/node-onesignal');
const jwt = require('jsonwebtoken')

// OneSignal Configuration
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'your-onesignal-app-id';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || 'your-onesignal-rest-api-key';

// Initialize OneSignal client
const configuration = OneSignal.createConfiguration({
  authMethods: {
    rest_api_key: {
      tokenProvider: {
        getToken() {
          return ONESIGNAL_API_KEY;
        }
      }
    }
  }
});

const client = new OneSignal.DefaultApi(configuration);

// Function to send notification to specific customers by agent IDs
async function sendNotificationToAgents(agentIds, title, message, data = {}) {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    
    // Use filters to target specific agents
    notification.filters = [
      {
        field: "tag",
        key: "agent_id",
        relation: "exists"
      },
      {
        operator: "AND"
      },
      {
        field: "tag",
        key: "agent_id",
        relation: "=",
        value: agentIds[0].toString()
      }
    ];
    
    // Add OR filters for multiple agent IDs
    for (let i = 1; i < agentIds.length && i < 10; i++) { // OneSignal has filter limits
      notification.filters.push(
        { operator: "OR" },
        {
          field: "tag",
          key: "agent_id",
          relation: "=",
          value: agentIds[i].toString()
        }
      );
    }
    
    notification.headings = { en: title };
    notification.contents = { en: message };
    
    // Add custom data
    if (Object.keys(data).length > 0) {
      notification.data = data;
    }
    
    // Add action buttons
    notification.buttons = [
      {
        id: "view_route",
        text: "View Route",
        icon: "ic_menu_mapmode"
      },
      {
        id: "dismiss",
        text: "Dismiss"
      }
    ];
    
    const response = await client.createNotification(notification);
    console.log('OneSignal notification sent to agents:', response);
    return response;
  } catch (error) {
    console.error('Error sending OneSignal notification to agents:', error);
    throw error;
  }
}

// Function to send notification to all active route agents
async function sendNotificationToActiveRouteAgents(title, message, data = {}) {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    
    // Target agents with active route status
    notification.filters = [
      {
        field: "tag",
        key: "route_status",
        relation: "=",
        value: "true"
      }
    ];
    
    notification.headings = { en: title };
    notification.contents = { en: message };
    
    if (Object.keys(data).length > 0) {
      notification.data = data;
    }
    
    const response = await client.createNotification(notification);
    console.log('OneSignal hourly notification sent to active route agents:', response);
    return response;
  } catch (error) {
    console.error('Error sending hourly notification to active route agents:', error);
    throw error;
  }
}

// Function to update agent tags in OneSignal
async function updateAgentTags(playerId, tags) {
  try {
    const player = new OneSignal.Player();
    player.tags = tags;
    
    await client.updatePlayer(ONESIGNAL_APP_ID, playerId, player);
    console.log(`Updated tags for player ${playerId}:`, tags);
  } catch (error) {
    console.error('Error updating player tags:', error);
    // Don't throw error as this is secondary operation
  }
}

// Function to update multiple agents' OneSignal tags
async function updateMultipleAgentTags(agentIds, routeStatus, routeId, routeName) {
  try {
    // In a real implementation, you'd get player IDs from your database
    // For now, we'll use a filter-based approach or get player IDs from DB
    
    // Get agents with their OneSignal player IDs from database
    const agents = await SalesAgent.find({ 
      _id: { $in: agentIds } 
    }).select('_id oneSignalPlayerId');
    
    const updatePromises = agents.map(agent => {
      if (agent.oneSignalPlayerId) {
        return updateAgentTags(agent.oneSignalPlayerId, {
          agent_id: agent._id.toString(),
          route_status: routeStatus.toString(),
          route_id: routeId,
          route_name: routeName,
          last_updated: new Date().toISOString()
        });
      }
    });
    
    await Promise.all(updatePromises.filter(Boolean));
    console.log(`Updated OneSignal tags for ${updatePromises.length} agents`);
  } catch (error) {
    console.error('Error updating multiple agent tags:', error);
  }
}

// Your modified route endpoint
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
    const newStatus = !route.status;
    route.status = newStatus;
    const updatedRoute = await route.save();
   
    let agentIds = [];
    let notificationSent = false;
   
    // Update sales agents based on route status (both enable and disable)
    try {
      // Find route setup document by route ID
      const routeSetup = await RouteSetup.findOne({ routeId: id });
     
      if (routeSetup && routeSetup.salesAgents && routeSetup.salesAgents.length > 0) {
        // Extract agent IDs from salesAgents array
        agentIds = routeSetup.salesAgents.map(agent => agent.agentId);
        console.log('Agent IDs to update:', agentIds);
       
        // Update route status for all these agents (true if route enabled, false if disabled)
        const updateResult = await SalesAgent.updateMany(
          { _id: { $in: agentIds } },
          { $set: { routeStatus: newStatus } }
        );
       
        console.log(`Route ${newStatus ? 'enabled' : 'disabled'}: Updated route status for ${updateResult.modifiedCount} sales agents out of ${agentIds.length} total agents`);
        
        // Update OneSignal tags for all affected agents
        await updateMultipleAgentTags(agentIds, newStatus, id, route.name);
        
        // Send notifications if route is enabled
        if (newStatus === true && agentIds.length > 0) {
          try {
            const notificationTitle = 'Route Activated';
            const notificationMessage = `Your route "${route.name}" has been activated and is now live!`;
            const notificationData = {
              type: 'route_activated',
              route_id: id,
              route_name: route.name,
              timestamp: new Date().toISOString(),
              agent_count: agentIds.length
            };
            
            await sendNotificationToAgents(agentIds, notificationTitle, notificationMessage, notificationData);
            notificationSent = true;
            console.log(`Notification sent to ${agentIds.length} agents for route activation`);
          } catch (notificationError) {
            console.error('Error sending activation notification:', notificationError);
            // Don't fail the request if notification fails
          }
        }
        
        // Send notification if route is disabled (optional)
        if (newStatus === false && agentIds.length > 0) {
          try {
            const notificationTitle = 'Route Deactivated';
            const notificationMessage = `Route "${route.name}" has been deactivated.`;
            const notificationData = {
              type: 'route_deactivated', 
              route_id: id,
              route_name: route.name,
              timestamp: new Date().toISOString()
            };
            
            await sendNotificationToAgents(agentIds, notificationTitle, notificationMessage, notificationData);
            console.log(`Deactivation notification sent to ${agentIds.length} agents`);
          } catch (notificationError) {
            console.error('Error sending deactivation notification:', notificationError);
          }
        }
        
      } else {
        console.log(`Route ${newStatus ? 'enabled' : 'disabled'}: No route setup or sales agents found for route ID: ${id}`);
      }
    } catch (agentUpdateError) {
      console.error('Error updating sales agents:', agentUpdateError);
      // Note: We don't return error here as the route status was successfully updated
      // This is a secondary operation that shouldn't fail the main request
    }
   
    // Format response
    const formattedRoute = {
      id: updatedRoute._id,
      name: updatedRoute.name,
      status: updatedRoute.status,
      createdAt: updatedRoute.formattedCreatedAt
    };
   
    // Enhanced response message
    let responseMessage = newStatus ?
      'Route enabled and sales agents updated successfully' :
      'Route disabled and sales agents updated successfully';
    
    if (notificationSent) {
      responseMessage += ` - Notifications sent to ${agentIds.length} agents`;
    }
   
    res.status(200).json({
      success: true,
      message: responseMessage,
      data: formattedRoute,
      notifications: {
        sent: notificationSent,
        agentCount: agentIds.length
      }
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

// Route to register agent's OneSignal player ID
router.post('/register-agent-player', async (req, res) => {
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

    const agentId = decoded.id
    const {  playerId } = req.body;
    
    if (!agentId || !playerId) {
      return res.status(400).json({ 
        success: false,
        error: 'Agent ID and Player ID are required' 
      });
    }
    
    // Update agent with OneSignal player ID
    const agent = await SalesAgent.findByIdAndUpdate(
      agentId,
      { oneSignalPlayerId: playerId },
      { new: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Set initial tags in OneSignal
    await updateAgentTags(playerId, {
      agent_id: agentId,
      route_status: agent.routeStatus ? 'true' : 'false',
      agent_name: agent.name || '',
      registered_at: new Date().toISOString()
    });
    
    res.json({ 
      success: true,
      message: 'Agent Player ID registered successfully' 
    });
  } catch (error) {
    console.error('Error registering agent player ID:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Hourly notification function
async function sendHourlyNotifications() {
  try {
    console.log('Sending hourly notifications to agents with active routes...');
    
    const currentTime = new Date().toLocaleString();
    
    const response = await sendNotificationToActiveRouteAgents(
      'Hourly Route Update',
      `Your route is still active as of ${currentTime}. Keep up the great work!`,
      {
        type: 'hourly_update',
        timestamp: new Date().toISOString()
      }
    );
    
    console.log('Hourly notifications sent successfully:', response);
  } catch (error) {
    console.error('Error sending hourly notifications:', error);
  }
}

// Schedule hourly notifications - runs every hour at minute 0
cron.schedule('0 * * * *', () => {
  console.log('Running hourly notification job...');
  sendHourlyNotifications();
});

// Manual trigger for hourly notifications (for testing)
router.post('/send-hourly-notification', async (req, res) => {
  try {
    await sendHourlyNotifications();
    res.json({
      success: true,
      message: 'Hourly notifications sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 

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

// Add this import if missing



module.exports = router;
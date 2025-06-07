const express = require('express');
const cron = require('node-cron');
const * as OneSignal from '@onesignal/node-onesignal';

const app = express();
app.use(express.json());

// OneSignal Configuration
const ONESIGNAL_APP_ID = 'your-onesignal-app-id';
const ONESIGNAL_API_KEY = 'your-onesignal-rest-api-key';

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

// Store customer player IDs (in production, use database)
let customerPlayerIds = {};

// Function to send notification to specific customers
async function sendNotificationToCustomers(playerIds, title, message, data = {}) {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_player_ids = playerIds;
    notification.headings = { en: title };
    notification.contents = { en: message };
    
    // Add custom data if needed
    if (Object.keys(data).length > 0) {
      notification.data = data;
    }
    
    // Optional: Add action buttons
    notification.buttons = [
      {
        id: "view_route",
        text: "View Route",
        icon: "ic_menu_mapmode"
      }
    ];
    
    const response = await client.createNotification(notification);
    console.log('OneSignal notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    throw error;
  }
}

// Function to send notification to all customers with active routes
async function sendNotificationToActiveRouteCustomers(title, message, data = {}) {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    
    // Use filters to target customers with active routes
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
    console.log('OneSignal notification sent to active route customers:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification to active route customers:', error);
    throw error;
  }
}

// Function to get customers with route status true
async function getCustomersWithActiveRoutes() {
  // Replace this with your actual database query
  // Example:
  // const customers = await Customer.find({ routeStatus: true });
  
  // Mock data for example
  const customers = [
    { id: 1, name: 'Customer 1', routeStatus: true, playerId: 'player-id-1' },
    { id: 2, name: 'Customer 2', routeStatus: true, playerId: 'player-id-2' },
    { id: 3, name: 'Customer 3', routeStatus: false, playerId: 'player-id-3' },
  ];
  
  return customers.filter(customer => customer.routeStatus === true);
}
// Function to update customer tags in OneSignal
async function updateCustomerTags(playerId, tags) {
  try {
    const player = new OneSignal.Player();
    player.tags = tags;
    
    await client.updatePlayer(ONESIGNAL_APP_ID, playerId, player);
    console.log(`Updated tags for player ${playerId}:`, tags);
  } catch (error) {
    console.error('Error updating player tags:', error);
    throw error;
  }
}
// Route to register customer OneSignal player ID
app.post('/register-player', async (req, res) => {
  try {
    const { customerId, playerId, routeStatus = false } = req.body;
    
    if (!customerId || !playerId) {
      return res.status(400).json({ error: 'Customer ID and Player ID are required' });
    }
    
    // Store player ID
    customerPlayerIds[customerId] = playerId;
    
    // Set initial tags in OneSignal
    await updateCustomerTags(playerId, {
      customer_id: customerId.toString(),
      route_status: routeStatus.toString()
    });
    
    res.json({ message: 'Player ID registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to manually send notification to active route customers
app.post('/send-notification', async (req, res) => {
  try {
    const { title = 'Route Status Update', message = 'Your route is currently active' } = req.body;
    
    const response = await sendNotificationToActiveRouteCustomers(title, message, {
      type: 'route_update',
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Notification sent successfully',
      response: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to send notification to specific customers
app.post('/send-notification-specific', async (req, res) => {
  try {
    const { customerIds, title, message } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({ error: 'Customer IDs array is required' });
    }
    
    const playerIds = customerIds.map(id => customerPlayerIds[id]).filter(Boolean);
    
    if (playerIds.length === 0) {
      return res.status(400).json({ error: 'No valid player IDs found for given customers' });
    }
    
    const response = await sendNotificationToCustomers(
      playerIds, 
      title || 'Route Update', 
      message || 'You have a route update',
      { type: 'specific_update' }
    );
    
    res.json({ 
      message: 'Notification sent successfully',
      sentTo: playerIds.length,
      response: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to update customer route status
app.post('/update-route-status', async (req, res) => {
  try {
    const { customerId, routeStatus } = req.body;
    
    if (!customerId || typeof routeStatus !== 'boolean') {
      return res.status(400).json({ error: 'Customer ID and route status (boolean) are required' });
    }
    
    // Update customer route status in your database
    // Example: await Customer.findByIdAndUpdate(customerId, { routeStatus });
    
    // Update OneSignal tags
    const playerId = customerPlayerIds[customerId];
    if (playerId) {
      await updateCustomerTags(playerId, {
        route_status: routeStatus.toString(),
        last_updated: new Date().toISOString()
      });
      
      // If route status is set to true, send immediate notification
      if (routeStatus === true) {
        await sendNotificationToCustomers(
          [playerId],
          'Route Activated',
          'Your route has been activated and is now live!',
          { 
            type: 'route_activated',
            customer_id: customerId 
          }
        );
      }
    }
    
    res.json({ message: 'Route status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to send hourly notifications
async function sendHourlyNotifications() {
  try {
    console.log('Sending hourly notifications to customers with active routes...');
    
    const currentTime = new Date().toLocaleString();
    
    const response = await sendNotificationToActiveRouteCustomers(
      'Hourly Route Update',
      `Your route is still active as of ${currentTime}`,
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

// Schedule hourly notifications
// This runs every hour at minute 0
cron.schedule('0 * * * *', () => {
  console.log('Running hourly notification job...');
  sendHourlyNotifications();
});

// Route to get notification history (if you want to track)
app.get('/notification-history', (req, res) => {
  // You can implement notification history tracking here
  res.json({ message: 'Notification history endpoint - implement as needed' });
});

// Route to test OneSignal connection
app.get('/test-onesignal', async (req, res) => {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.included_segments = ['Test Users']; // or use include_player_ids for specific users
    notification.headings = { en: 'Test Notification' };
    notification.contents = { en: 'This is a test notification from your Express server!' };
    
    const response = await client.createNotification(notification);
    res.json({ message: 'Test notification sent', response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    scheduler: 'Active'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('OneSignal notification system is active');
  console.log('Hourly notification scheduler is running');
  console.log(`OneSignal App ID: ${ONESIGNAL_APP_ID}`);
});

module.exports = app;
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDb = require('./database/db');
const AdminauthRoutes = require('./routes/AdminAuth');
const categoryRoutes = require('./routes/categoryRoutes');
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const attributeRoutes = require("./routes/attributeRoutes");
const productRoutes = require('./routes/product');
const bannerRoutes = require('./routes/bannerRoutes');
const villageRoutes = require('./routes/village');
const salesAgentRoutes = require('./routes/salesAgentRoute');
const routeRoutes = require('./routes/route');
const routeSetupRoutes = require('./routes/routeSetupRputes');
const combineRoutes = require('./routes/combineRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/Order');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://e-commerce-admin-frontend.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected print clients
const printClients = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Register print client
  socket.on('register-print-client', (data) => {
    printClients.set(socket.id, {
      id: socket.id,
      name: data.clientName || 'Print Client',
      type: data.type || 'THERMAL',
      connected: true,
      lastSeen: new Date()
    });

    console.log(`🖨️  Print client registered: ${data.clientName} (${data.type})`);
    socket.emit('registration-success', { message: 'Print client registered successfully' });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (printClients.has(socket.id)) {
      console.log(`🖨️  Print client disconnected: ${printClients.get(socket.id).name}`);
      printClients.delete(socket.id);
    }
  });

  // Confirm print completion
  socket.on('print-completed', (data) => {
    console.log(`✅ Print completed for order: ${data.orderId} (${data.type})`);
  });

  // Handle print errors
  socket.on('print-error', (data) => {
    console.error(`❌ Print failed for order: ${data.orderId} (${data.type})`, data.error);
  });
});

// Make io and printClients available to routes
app.set('io', io);
app.set('printClients', printClients);

connectToDb();

app.set('trust proxy', 1);

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://e-commerce-admin-frontend.onrender.com",
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Define routes
app.use('/auth/admin', AdminauthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use("/api/attributes", attributeRoutes);
app.use('/api/products', productRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/villages", villageRoutes);
app.use("/api/salesAgents", salesAgentRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/routesSetup", routeSetupRoutes);
app.use("/api/c/b/d", combineRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint for print clients
app.get('/api/print-clients', (req, res) => {
  const clients = Array.from(printClients.values());
  res.json({
    totalClients: clients.length,
    clients: clients,
    status: clients.length > 0 ? 'Printer Connected' : 'No Printer Connected'
  });
});

// Start server using http server instead of app.listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🖨️  Print service ready - Waiting for print clients...`);
});
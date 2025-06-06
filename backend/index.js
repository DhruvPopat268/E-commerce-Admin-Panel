require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // Add this
const { Server } = require('socket.io'); // Add this
const cookieParser = require('cookie-parser');
const path = require('path');

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
const server = http.createServer(app); // Create HTTP server

// Create Socket.IO server and attach it to HTTP server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://e-commerce-admin-frontend.onrender.com",
    ],
    credentials: true
  }
});

// Store io instance globally for use in routes
app.set('io', io);

// Handle client connections
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// Connect to DB
connectToDb();

app.set('trust proxy', 1); // Required on Render for secure cookies to work

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
app.use('/api/orders', orderRoutes); // Will emit socket from here

// Start server using http server instead of app.listen
server.listen(process.env.PORT, () => {
  console.log(`🚀 Server is running on port ${process.env.PORT}`);
});

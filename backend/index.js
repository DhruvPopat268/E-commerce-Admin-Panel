require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectToDb = require('./database/db');

const AdminauthRoutes = require('./routes/AdminAuth');
const categoryRoutes = require('./routes/categoryRoutes'); // import category routes
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const attributeRoutes = require("./routes/attributeRoutes");
const productRoutes = require('./routes/product');
const bannerRoutes = require('./routes/bannerRoutes')
const villageRoutes = require('./routes/village')
const salesAgentRoutes = require('./routes/salesAgentRoute')
const routeRoutes = require('./routes/route')
const routeSetupRoutes = require('./routes/routeSetupRputes')
const combineRoutes = require('./routes/combineRoutes')
const cookieParser = require('cookie-parser');
const cartRoutes = require('./routes/cartRoutes');
const path = require('path');
const orderRoutes = require('./routes/Order'); 

const app = express();

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

// Serve uploads folder statically for images
app.use('/uploads', express.static('uploads'));

// Existing routes
app.use('/auth/admin', AdminauthRoutes);

// New category routes
app.use('/api/categories', categoryRoutes);

app.use('/api/subcategories', subCategoryRoutes);

app.use("/api/attributes", attributeRoutes);

app.use('/api/products', productRoutes);

app.use("/api/banners", bannerRoutes);

app.use("/api/villages", villageRoutes);

app.use("/api/salesAgents", salesAgentRoutes)

app.use("/api/routes", routeRoutes)

app.use("/api/routesSetup", routeSetupRoutes)

app.use("/api/c/b/d",combineRoutes)

app.use('/api/cart', cartRoutes);

app.use('/api/orders', orderRoutes);  

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
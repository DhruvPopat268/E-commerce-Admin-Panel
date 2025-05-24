require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectToDb = require('./database/db');

const AdminauthRoutes = require('./routes/AdminAuth');
const categoryRoutes = require('./routes/categoryRoutes'); // import category routes
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const attributeRoutes = require("./routes/attributeRoutes");
const productRoutes = require('./routes/product');
const path = require('path');

const app = express();

connectToDb();

app.use(cors({
  origin: ["http://localhost:3000",
    "https://e-commerce-admin-panel-frontend.onrender.com",
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Serve uploads folder statically for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Existing routes
app.use('/auth/admin', AdminauthRoutes);

// New category routes
app.use('/api/categories', categoryRoutes);

app.use('/api/subcategories', subCategoryRoutes);

app.use("/api/attributes", attributeRoutes);

app.use('/api/products', productRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

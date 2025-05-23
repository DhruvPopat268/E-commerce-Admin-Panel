require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectToDb = require('./database/db');

const AdminauthRoutes = require('./routes/AdminAuth');
const categoryRoutes = require('./routes/categoryRoutes'); // import category routes
const path = require('path');

const app = express();

connectToDb();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// Serve uploads folder statically for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Existing routes
app.use('/auth/admin', AdminauthRoutes);

// New category routes
app.use('/api/categories', categoryRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

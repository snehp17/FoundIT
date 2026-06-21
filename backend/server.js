// Load environment variables before anything else
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/db');

const app = express();

// Init Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use("/uploads", express.static("uploads"));

// Define Routes
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/admin", adminRoutes);

app.get('/', (req, res) => {
  res.send('API Running');
});

const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL, sync tables, then start server
const startServer = async () => {
  await connectDB();
  require('./models'); // Load models and associations
  // sync: creates tables if they don't exist (safe - does not drop existing data)
  await sequelize.sync({ alter: true }); // Using alter: true to update schema for existing tables
  console.log('All models synced with PostgreSQL.');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
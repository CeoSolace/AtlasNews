const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file if present
dotenv.config();

const connectDB = require('./config/db');

// Import route handlers
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const commentRoutes = require('./routes/comments');
const adRoutes = require('./routes/ads');

// Initialize Express application
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ads', adRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AtlasRegion7 API server running on port ${PORT}`);
});
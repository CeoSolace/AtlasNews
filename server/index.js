const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ads', adRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * ==========================
 * FRONTEND STATIC SERVE
 * ==========================
 * Serve the frontend files from the project root.
 * (__dirname = /server, so .. = project root)
 */
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR));

/**
 * Fallback route:
 * If request is NOT for /api and NOT for a real file, serve index.html.
 * This prevents breaking refresh/deep links.
 */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AtlasRegion7 API server running on port ${PORT}`);
});

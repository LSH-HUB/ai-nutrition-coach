const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/db');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images
app.use('/assets/uploads', express.static(path.join(__dirname, '../mobile_app/assets/uploads')));

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Nutrition Coach API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n========================================`);
      console.log(`  AI Nutrition Coach Backend Server`);
      console.log(`  Running on http://0.0.0.0:${PORT}`);
      console.log(`  API endpoints available at /api/*`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

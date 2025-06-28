const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Firebase config
const { db, auth } = require('./config/firebase');

// Import routes
const bloodInventoryRoutes = require('./routes/bloodInventory');
const bloodBanksRoutes = require('./routes/bloodBanks');
const bloodRequestsRoutes = require('./routes/bloodRequests');
const searchRoutes = require('./routes/search');
const campaignsRoutes = require('./routes/campaigns');

// Import middleware
const { authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'RedRelief API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'RedRelief API Documentation',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      bloodInventory: {
        getAll: 'GET /api/blood-inventory',
        getById: 'GET /api/blood-inventory/:id',
        create: 'POST /api/blood-inventory',
        update: 'PUT /api/blood-inventory/:id',
        delete: 'DELETE /api/blood-inventory/:id'
      },
      bloodBanks: {
        getAll: 'GET /api/blood-banks',
        getById: 'GET /api/blood-banks/:id',
        create: 'POST /api/blood-banks',
        update: 'PUT /api/blood-banks/:id',
        delete: 'DELETE /api/blood-banks/:id',
        getInventory: 'GET /api/blood-banks/:id/inventory'
      },
      bloodRequests: {
        getAll: 'GET /api/blood-requests',
        getById: 'GET /api/blood-requests/:id',
        create: 'POST /api/blood-requests',
        update: 'PUT /api/blood-requests/:id',
        updateStatus: 'PATCH /api/blood-requests/:id/status',
        delete: 'DELETE /api/blood-requests/:id'
      },
      campaigns: {
        getAll: 'GET /api/campaigns',
        getById: 'GET /api/campaigns/:id',
        create: 'POST /api/campaigns',
        update: 'PUT /api/campaigns/:id',
        updateStatus: 'PATCH /api/campaigns/:id/status',
        delete: 'DELETE /api/campaigns/:id',
        getByBloodBank: 'GET /api/campaigns/blood-bank/:bloodBankId',
        getByCity: 'GET /api/campaigns/city/:city'
      },
      search: {
        combined: 'GET /api/search',
        byBloodType: 'GET /api/search/blood-type/:type',
        byCity: 'GET /api/search/city/:city',
        availableTypes: 'GET /api/search/available-types',
        cities: 'GET /api/search/cities'
      }
    },
    authentication: {
      required: 'Bearer token in Authorization header',
      example: 'Authorization: Bearer <firebase_id_token>'
    }
  });
});

// API Routes
app.use('/api/blood-inventory', optionalAuth, bloodInventoryRoutes);
app.use('/api/blood-banks', optionalAuth, bloodBanksRoutes);
app.use('/api/blood-requests', optionalAuth, bloodRequestsRoutes);
app.use('/api/campaigns', optionalAuth, campaignsRoutes);
app.use('/api/search', optionalAuth, searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    availableEndpoints: [
      '/api/health',
      '/api/docs',
      '/api/blood-inventory',
      '/api/blood-banks',
      '/api/blood-requests',
      '/api/campaigns',
      '/api/search'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 RedRelief API Server running on port ${PORT}`);
  console.log(`📱 Mobile API ready at http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 
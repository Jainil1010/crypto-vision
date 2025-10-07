import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { PORT } from "./config/env.js";
import authRouter from "./routes/auth.routes.js";
import { connectDB } from "./config/database.js";
import tradingRouter from './routes/trading.routes.js';
import { initContract } from './config/blockchain.js';
import binanceService from './services/binance.service.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", authRouter);
app.use('/api/v1/trading', tradingRouter);

// Root endpoint with API documentation
app.get("/", (req, res) => {
  res.json({ 
    message: "Crypto-Vision DApp Server with Real-time Binance Integration!",
    version: "2.0.0",
    features: [
      "Real-time Binance price feeds",
      "Blockchain smart contract integration", 
      "Secure user authentication",
      "Live cryptocurrency trading",
      "Portfolio management"
    ],
    blockchain: "Connected to Ganache",
    database: "MySQL Connected",
    priceSource: "Binance API",
    endpoints: {
      auth: "/api/v1/auth/*",
      trading: "/api/v1/trading/*",
      market: "/api/v1/trading/market/*"
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { getDB } = await import('./config/database.js');
    const db = getDB();
    await db.execute('SELECT 1');
    
    // Test Binance API connection
    const binanceHealth = await binanceService.healthCheck();
    
    res.json({
      success: true,
      status: 'healthy',
      services: {
        database: 'connected',
        blockchain: 'connected',  
        binanceAPI: binanceHealth.status === 'healthy' ? 'connected' : 'disconnected',
        server: 'running'
      },
      binanceData: binanceHealth,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Binance-specific health check
app.get('/health/binance', async (req, res) => {
  try {
    const health = await binanceService.healthCheck();
    res.json({
      success: health.status === 'healthy',
      ...health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      auth: '/api/v1/auth/*',
      trading: '/api/v1/trading/*',
      health: '/health',
      binanceHealth: '/health/binance'
    }
  });
});

// Start server with proper initialization
const startServer = async () => {
  try {
    console.log('\n🚀 Starting Crypto-Vision Server...');
    console.log('=====================================');
    
    // Connect to database
    console.log('📊 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Initialize blockchain contract
    console.log('⛓️  Initializing blockchain contract...');
    await initContract();
    console.log('✅ Blockchain contract initialized');
    
    // Initialize Binance service (already happens in constructor)
    console.log('💹 Initializing Binance service...');
    const binanceHealth = await binanceService.healthCheck();
    if (binanceHealth.status === 'healthy') {
      console.log('✅ Binance API connected successfully');
    } else {
      console.log('⚠️  Binance API connection issues (will use fallback data)');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('=====================================');
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/v1/auth`);
      console.log(`💰 Trading API: http://localhost:${PORT}/api/v1/trading`);
      console.log(`📈 Market Data: http://localhost:${PORT}/api/v1/trading/cryptocurrencies`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`💹 Binance Health: http://localhost:${PORT}/health/binance`);
      console.log('=====================================');
      console.log('🔗 Make sure Ganache GUI is running on http://127.0.0.1:7545');
      console.log('💡 Real-time crypto prices powered by Binance API');
      console.log('=====================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server gracefully...');
  process.exit(0);
});

startServer();
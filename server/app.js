import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import authRouter from "./routes/auth.routes.js";
import { connectDB } from "./config/database.js";
import tradingRouter from './routes/trading.routes.js';
import { initContract } from './config/blockchain.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRouter);
app.use('/api/v1/trading', tradingRouter);

app.get("/", (req, res) => {
  res.json({ 
    message: "Crypto-Vision DApp Server is running!",
    version: "1.0.0",
    blockchain: "Connected to Ganache",
    database: "MySQL Connected"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server with proper initialization
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');

    // Initialize blockchain contract
    await initContract();
    console.log('✅ Blockchain contract initialized');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port: http://localhost:${PORT}`);
      console.log('📊 API Documentation:');
      console.log('   - Auth: http://localhost:' + PORT + '/api/v1/auth');
      console.log('   - Trading: http://localhost:' + PORT + '/api/v1/trading');
      console.log('🔗 Make sure Ganache GUI is running on http://127.0.0.1:7545');
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

startServer();
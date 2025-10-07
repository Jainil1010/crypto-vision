import express from 'express';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware.js';
import {
  getSupportedCryptocurrencies,
  getCryptocurrencyPrice,
  buyCryptocurrency,
  sellCryptocurrency,
  getUserBalances,
  getUserTransactionHistory,
  getTransactionDetails,
  getMarketOverview,
  getBinanceHealth
} from '../controllers/trading.controller.js';

const tradingRouter = express.Router();

// Public routes (no authentication required) - Market data
tradingRouter.get('/cryptocurrencies', optionalAuth, getSupportedCryptocurrencies);
tradingRouter.get('/price/:symbol', optionalAuth, getCryptocurrencyPrice);
tradingRouter.get('/market/overview', optionalAuth, getMarketOverview);
tradingRouter.get('/health/binance', getBinanceHealth);

// Protected routes (authentication required) - Trading operations
tradingRouter.post('/buy', authenticateToken, buyCryptocurrency);
tradingRouter.post('/sell', authenticateToken, sellCryptocurrency);
tradingRouter.get('/balances', authenticateToken, getUserBalances);
tradingRouter.get('/portfolio', authenticateToken, getUserBalances); // Alias for balances
tradingRouter.get('/transactions', authenticateToken, getUserTransactionHistory);
tradingRouter.get('/history', authenticateToken, getUserTransactionHistory); // Alias for transactions
tradingRouter.get('/transaction/:transactionId', authenticateToken, getTransactionDetails);

export default tradingRouter;
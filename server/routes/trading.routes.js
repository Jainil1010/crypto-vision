import express from 'express';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware.js';
import {
    getSupportedCryptocurrencies,
    getCryptocurrencyPrice,
    buyCryptocurrency,
    sellCryptocurrency,
    getUserBalances,
    getUserTransactionHistory,
    getTransactionDetails
} from '../controllers/trading.controller.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/cryptocurrencies', optionalAuth, getSupportedCryptocurrencies);
router.get('/price/:symbol', optionalAuth, getCryptocurrencyPrice);

// Protected routes (authentication required)
router.post('/buy', authenticateToken, buyCryptocurrency);
router.post('/sell', authenticateToken, sellCryptocurrency);
router.get('/balances', authenticateToken, getUserBalances);
router.get('/transactions', authenticateToken, getUserTransactionHistory);
router.get('/transaction/:transactionId', authenticateToken, getTransactionDetails);

export default router;
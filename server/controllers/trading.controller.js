import { getDB } from '../config/database.js';
import {   
  buyCryptocurrency as blockchainBuy,
  sellCryptocurrency as blockchainSell,
  getUserCryptoBalance,
  getSupportedCryptos as getBlockchainCryptos,
  getUserTransactions as getBlockchainTransactions,
  getAccountBalance
} from '../config/blockchain.js';
import binanceService from '../services/binance.service.js';

// Get all supported cryptocurrencies with real-time prices
export const getSupportedCryptocurrencies = async (req, res) => {
  try {
    console.log('📈 Fetching supported cryptocurrencies with real-time prices...');
    
    // Get supported cryptos from both blockchain and Binance
    const binanceCryptos = binanceService.getSupportedCryptos();
    console.log('Binance supported cryptos:', binanceCryptos);
    
    // Get real-time prices from Binance
    const allPrices = await binanceService.getAllPrices();
    console.log('Real-time prices fetched:', allPrices);
    
    // Format response with real prices
    const cryptosWithPrices = binanceCryptos.map(crypto => ({
      symbol: crypto,
      name: binanceService.getCryptoName(crypto),
      price: allPrices[crypto] || '0.00000000',
      priceInETH: allPrices[crypto] || '0.00000000', // Keep for backward compatibility
      source: 'binance-api'
    }));

    res.status(200).json({
      success: true,
      data: {
        cryptocurrencies: cryptosWithPrices,
        totalSupported: cryptosWithPrices.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching supported cryptocurrencies:', error);
    
    // Fallback to basic crypto list
    const fallbackCryptos = ['BTC', 'ETH', 'ADA', 'DOT', 'BNB', 'XRP', 'SOL', 'MATIC'];
    const fallbackData = fallbackCryptos.map(crypto => ({
      symbol: crypto,
      name: binanceService.getCryptoName(crypto),
      price: binanceService.getFallbackPrice(crypto),
      priceInETH: binanceService.getFallbackPrice(crypto),
      source: 'fallback'
    }));
    
    res.status(200).json({
      success: true,
      data: {
        cryptocurrencies: fallbackData,
        totalSupported: fallbackData.length,
        lastUpdated: new Date().toISOString(),
        warning: 'Using fallback prices due to API error'
      }
    });
  }
};

// Get real-time cryptocurrency price
export const getCryptocurrencyPrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Cryptocurrency symbol is required'
      });
    }

    console.log(`💰 Fetching real-time price for ${symbol}...`);
    
    // Check if symbol is supported
    if (!binanceService.isSupported(symbol)) {
      return res.status(400).json({
        success: false,
        message: `${symbol} is not supported`,
        supportedCryptos: binanceService.getSupportedCryptos()
      });
    }

    // Get real-time price from Binance
    const price = await binanceService.getPrice(symbol.toUpperCase());
    const stats = await binanceService.get24hrStats(symbol.toUpperCase());

    res.status(200).json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        name: binanceService.getCryptoName(symbol.toUpperCase()),
        price: price,
        priceInETH: price, // Keep for backward compatibility
        stats,
        source: 'binance-api',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching cryptocurrency price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cryptocurrency price',
      error: error.message
    });
  }
};

// Buy cryptocurrency with real-time pricing
export const buyCryptocurrency = async (req, res) => {
  try {
    const { cryptoSymbol, amount, ethValue } = req.body;
    const userId = req.user.id;
    const userWalletAddress = req.user.wallet_address;

    console.log(`🛒 Processing buy order: ${amount} ${cryptoSymbol} for user ${userId}`);
    if (!cryptoSymbol || !amount || !ethValue) {
      return res.status(400).json({ success: false, message: 'Please provide cryptoSymbol, amount, and ethValue' });
    }
    if (amount <= 0 || ethValue <= 0) {
      return res.status(400).json({ success: false, message: 'Amount and ethValue must be greater than 0' });
    }
    if (!binanceService.isSupported(cryptoSymbol)) {
      return res.status(400).json({
        success: false,
        message: `${cryptoSymbol} is not supported`,
        supportedCryptos: binanceService.getSupportedCryptos()
      });
    }

    const currentPrice = await binanceService.getPrice(cryptoSymbol.toUpperCase());
    console.log(`💰 Current ${cryptoSymbol} price: $${currentPrice}`);

    // Only call smart contract for tokens, skip ETH/BTC
    let blockchainResult;
    if (cryptoSymbol !== 'ETH' && cryptoSymbol !== 'BTC') {
      const privateKey = process.env.USER_PRIVATE_KEY;
      try {
        blockchainResult = await blockchainBuy(userWalletAddress, privateKey, cryptoSymbol.toUpperCase(), amount, ethValue);
      } catch (err) {
        console.warn('Contract buy reverted:', err.message);
      }
      if (blockchainResult && !blockchainResult.success) {
        return res.status(400).json({ success: false, message: blockchainResult.error || 'Transaction has been reverted by the EVM' });
      }
    }

    const db = getDB();
    await db.execute(
      'INSERT INTO transactions (user_id, crypto_symbol, amount, price, type, tx_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [userId, cryptoSymbol.toUpperCase(), amount, currentPrice, 'buy', blockchainResult?.transactionHash || null]
    );

    res.status(200).json({
      success: true,
      message: 'Cryptocurrency purchased successfully',
      data: {
        transactionHash: blockchainResult?.transactionHash || null,
        cryptoSymbol: cryptoSymbol.toUpperCase(),
        amount, price: currentPrice,
        source: 'binance-price',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error buying cryptocurrency:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Sell cryptocurrency with real-time pricing
export const sellCryptocurrency = async (req, res) => {
  try {
    const { cryptoSymbol, amount } = req.body;
    const userId = req.user.id;
    const userWalletAddress = req.user.wallet_address;

    console.log(`🏪 Processing sell order: ${amount} ${cryptoSymbol} for user ${userId}`);
    if (!cryptoSymbol || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid cryptoSymbol and amount' });
    }
    if (!binanceService.isSupported(cryptoSymbol)) {
      return res.status(400).json({
        success: false,
        message: `${cryptoSymbol} is not supported`,
        supportedCryptos: binanceService.getSupportedCryptos()
      });
    }

    const db = getDB();
    const [[txSum]] = await db.execute(
      `SELECT SUM(CASE WHEN type='buy' THEN amount ELSE 0 END) bought,
              SUM(CASE WHEN type='sell' THEN amount ELSE 0 END) sold
       FROM transactions
       WHERE user_id=? AND crypto_symbol=?`,
      [userId, cryptoSymbol.toUpperCase()]
    );
    const balance = (txSum.bought || 0) - (txSum.sold || 0);
    if (balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient cryptocurrency balance. Available: ${balance}`
      });
    }

    const currentPrice = await binanceService.getPrice(cryptoSymbol.toUpperCase());
    let blockchainResult;
    if (cryptoSymbol !== 'ETH' && cryptoSymbol !== 'BTC') {
      const privateKey = process.env.USER_PRIVATE_KEY;
      try {
        blockchainResult = await blockchainSell(userWalletAddress, privateKey, cryptoSymbol.toUpperCase(), amount);
      } catch (err) {
        console.warn('Contract sell reverted:', err.message);
      }
      if (blockchainResult && !blockchainResult.success) {
        return res.status(400).json({ success: false, message: blockchainResult.error || 'EVM revert' });
      }
    }

    await db.execute(
      'INSERT INTO transactions (user_id, crypto_symbol, amount, price, type, tx_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [userId, cryptoSymbol.toUpperCase(), amount, currentPrice, 'sell', blockchainResult?.transactionHash || null]
    );

    res.status(200).json({
      success: true,
      message: 'Cryptocurrency sold successfully',
      data: {
        transactionHash: blockchainResult?.transactionHash || null,
        cryptoSymbol: cryptoSymbol.toUpperCase(),
        amount, price: currentPrice,
        source: 'binance-price',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error selling cryptocurrency:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get user's cryptocurrency balances with real-time values
export const getUserBalances = async (req, res) => {
  try {
    const userId = req.user.id;
    const userWalletAddress = req.user.wallet_address;
    const db = getDB();

    // Native ETH balance
    let nativeEthBalance = "0";
    try {
      nativeEthBalance = await getAccountBalance(userWalletAddress);
    } catch (err) {
      console.error('Error fetching native ETH balance:', err);
    }

    const supportedCryptos = binanceService.getSupportedCryptos();
    const allPrices = await binanceService.getAllPrices();
    const balances = [];
    let totalValue = 0;

    for (const crypto of supportedCryptos) {
      const [[txSum]] = await db.execute(
        `SELECT SUM(CASE WHEN type='buy' THEN amount ELSE 0 END) bought,
                SUM(CASE WHEN type='sell' THEN amount ELSE 0 END) sold
         FROM transactions WHERE user_id=? AND crypto_symbol=?`,
        [userId, crypto]
      );
      const balance = (txSum.bought || 0) - (txSum.sold || 0);
      if (balance > 0) {
        const price = allPrices[crypto];
        const value = (balance * parseFloat(price)).toFixed(2);
        totalValue += parseFloat(value);
        balances.push({ symbol: crypto, name: binanceService.getCryptoName(crypto), balance: balance.toFixed(8), price, value, source: 'binance-api' });
      }
    }

    balances.forEach(h => { h.percentage = totalValue > 0 ? ((parseFloat(h.value)/totalValue)*100).toFixed(2) : '0.00'; });

    res.status(200).json({
      success: true,
      data: {
        nativeEthBalance,
        cryptoBalances: balances,
        totalPortfolioValue: totalValue.toFixed(2),
        totalHoldings: balances.length,
        walletAddress: userWalletAddress,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get user's transaction history (unchanged)
export const getUserTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userWalletAddress = req.user.wallet_address;
    const db = getDB();

    // Get transactions from database with real-time prices for current values
    const [dbTransactions] = await db.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Enhance transactions with current prices
    const enhancedTransactions = await Promise.all(
      dbTransactions.map(async (tx) => {
        try {
          const currentPrice = await binanceService.getPrice(tx.crypto_symbol);
          return {
            ...tx,
            current_price: currentPrice,
            price_change: ((parseFloat(currentPrice) - parseFloat(tx.price)) / parseFloat(tx.price) * 100).toFixed(2)
          };
        } catch (error) {
          return {
            ...tx,
            current_price: tx.price,
            price_change: '0.00'
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: {
        transactions: enhancedTransactions,
        totalTransactions: enhancedTransactions.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get specific transaction details (unchanged but with current price info)
export const getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;
    const db = getDB();

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Get transaction from database
    const [transactions] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [transactionId, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const transaction = transactions[0];

    // Get current price for comparison
    try {
      const currentPrice = await binanceService.getPrice(transaction.crypto_symbol);
      const priceChange = ((parseFloat(currentPrice) - parseFloat(transaction.price)) / parseFloat(transaction.price) * 100).toFixed(2);
      
      transaction.current_price = currentPrice;
      transaction.price_change = priceChange;
      transaction.current_value = (parseFloat(transaction.amount) * parseFloat(currentPrice)).toFixed(2);
    } catch (error) {
      console.error('Error fetching current price for transaction:', error);
    }

    res.status(200).json({
      success: true,
      data: {
        transaction: transaction
      }
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// New endpoint: Get market overview
export const getMarketOverview = async (req, res) => {
  try {
    console.log('📊 Fetching market overview...');
    
    const marketData = await binanceService.getMarketOverview();
    
    res.status(200).json({
      success: true,
      data: {
        markets: marketData,
        totalMarkets: marketData.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market overview',
      error: error.message
    });
  }
};

// New endpoint: Get Binance API health status
export const getBinanceHealth = async (req, res) => {
  try {
    const health = await binanceService.healthCheck();
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    console.error('Error checking Binance health:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};
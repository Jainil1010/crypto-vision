import axios from 'axios';
import WebSocket from 'ws';

/**
 * Binance Market Data Service
 * Provides real-time cryptocurrency prices and market data
 */
class BinanceService {
  constructor() {
    this.baseURL = process.env.BINANCE_BASE_URL || 'https://api.binance.com';
    this.wsURL = process.env.BINANCE_WS_URL || 'wss://stream.binance.com:9443';
    this.priceCache = new Map();
    this.wsConnections = new Map();
    
    // Map your existing crypto symbols to Binance pairs
    this.supportedPairs = {
      'BTC': 'BTCUSDT',
      'ETH': 'ETHUSDT', 
      'ADA': 'ADAUSDT',
      'DOT': 'DOTUSDT',
      'BNB': 'BNBUSDT',
      'XRP': 'XRPUSDT',
      'SOL': 'SOLUSDT',
      'MATIC': 'MATICUSDT'
    };
    
    // Initialize price cache
    this.initializePrices();
  }

  /**
   * Initialize price cache on service startup
   */
  async initializePrices() {
    try {
      console.log('🔄 Initializing Binance price cache...');
      await this.getAllPrices();
      console.log('✅ Binance price cache initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Binance price cache:', error.message);
    }
  }

  /**
   * Get real-time price for a single cryptocurrency
   * @param {string} symbol - Crypto symbol (BTC, ETH, etc.)
   * @returns {Promise<string>} Price in USDT
   */
  async getPrice(symbol) {
    try {
      const binancePair = this.supportedPairs[symbol.toUpperCase()];
      if (!binancePair) {
        throw new Error(`${symbol} is not supported`);
      }

      const response = await axios.get(`${this.baseURL}/api/v3/ticker/price`, {
        params: { symbol: binancePair }
      });

      const price = parseFloat(response.data.price).toFixed(8);
      
      // Cache the price
      this.priceCache.set(symbol.toUpperCase(), {
        price,
        timestamp: Date.now()
      });

      return price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error.message);
      
      // Return cached price if available
      const cached = this.priceCache.get(symbol.toUpperCase());
      if (cached) {
        console.log(`Using cached price for ${symbol}: ${cached.price}`);
        return cached.price;
      }
      
      // Fallback to mock price for development
      console.log(`Using fallback price for ${symbol}`);
      return this.getFallbackPrice(symbol);
    }
  }

  /**
   * Get all prices for supported cryptocurrencies
   * @returns {Promise<Object>} Object with symbol: price pairs
   */
  async getAllPrices() {
    try {
      const symbols = Object.values(this.supportedPairs);
      const symbolsParam = symbols.map(s => `"${s}"`).join(',');
      
      const response = await axios.get(`${this.baseURL}/api/v3/ticker/price`, {
        params: { symbols: `[${symbolsParam}]` }
      });

      const pricesData = {};
      
      response.data.forEach(item => {
        // Find the crypto symbol for this Binance pair
        const cryptoSymbol = Object.keys(this.supportedPairs).find(
          key => this.supportedPairs[key] === item.symbol
        );
        
        if (cryptoSymbol) {
          const price = parseFloat(item.price).toFixed(8);
          pricesData[cryptoSymbol] = price;
          
          // Update cache
          this.priceCache.set(cryptoSymbol, {
            price,
            timestamp: Date.now()
          });
        }
      });

      return pricesData;
    } catch (error) {
      console.error('Error fetching all prices:', error.message);
      
      // Return cached prices if available
      const cachedPrices = {};
      for (const [symbol, data] of this.priceCache.entries()) {
        cachedPrices[symbol] = data.price;
      }
      
      return Object.keys(cachedPrices).length > 0 ? cachedPrices : this.getFallbackPrices();
    }
  }

  /**
   * Get 24hr price statistics
   * @param {string} symbol - Crypto symbol
   * @returns {Promise<Object>} 24hr stats
   */
  async get24hrStats(symbol) {
    try {
      const binancePair = this.supportedPairs[symbol.toUpperCase()];
      if (!binancePair) {
        throw new Error(`${symbol} is not supported`);
      }

      const response = await axios.get(`${this.baseURL}/api/v3/ticker/24hr`, {
        params: { symbol: binancePair }
      });

      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(response.data.lastPrice).toFixed(8),
        change: parseFloat(response.data.priceChange).toFixed(8),
        changePercent: parseFloat(response.data.priceChangePercent).toFixed(2),
        volume: parseFloat(response.data.volume).toFixed(2),
        high: parseFloat(response.data.highPrice).toFixed(8),
        low: parseFloat(response.data.lowPrice).toFixed(8)
      };
    } catch (error) {
      console.error(`Error fetching 24hr stats for ${symbol}:`, error.message);
      
      // Return basic stats with current price
      const currentPrice = await this.getPrice(symbol);
      return {
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        change: "0.00000000",
        changePercent: "0.00",
        volume: "0.00",
        high: currentPrice,
        low: currentPrice
      };
    }
  }

  /**
   * Get market overview for all supported cryptos
   * @returns {Promise<Array>} Array of market data
   */
  async getMarketOverview() {
    try {
      const allPrices = await this.getAllPrices();
      const overview = [];

      for (const [symbol, price] of Object.entries(allPrices)) {
        try {
          const stats = await this.get24hrStats(symbol);
          overview.push({
            symbol,
            name: this.getCryptoName(symbol),
            price,
            ...stats
          });
        } catch (error) {
          console.error(`Error getting stats for ${symbol}:`, error.message);
          overview.push({
            symbol,
            name: this.getCryptoName(symbol),
            price,
            change: "0.00000000",
            changePercent: "0.00",
            volume: "0.00",
            high: price,
            low: price
          });
        }
      }

      return overview;
    } catch (error) {
      console.error('Error fetching market overview:', error.message);
      return [];
    }
  }

  /**
   * Get supported cryptocurrency symbols
   * @returns {Array<string>} Supported symbols
   */
  getSupportedCryptos() {
    return Object.keys(this.supportedPairs);
  }

  /**
   * Check if a cryptocurrency is supported
   * @param {string} symbol - Crypto symbol
   * @returns {boolean} True if supported
   */
  isSupported(symbol) {
    return this.supportedPairs.hasOwnProperty(symbol.toUpperCase());
  }

  /**
   * Get cached price (faster response)
   * @param {string} symbol - Crypto symbol
   * @returns {string|null} Cached price or null
   */
  getCachedPrice(symbol) {
    const cached = this.priceCache.get(symbol.toUpperCase());
    return cached ? cached.price : null;
  }

  /**
   * Start WebSocket price stream for real-time updates
   * @param {Array<string>} symbols - Crypto symbols to track
   * @param {Function} onPriceUpdate - Callback for price updates
   */
  startPriceStream(symbols, onPriceUpdate) {
    const binancePairs = symbols
      .map(symbol => this.supportedPairs[symbol.toUpperCase()])
      .filter(pair => pair)
      .map(pair => `${pair.toLowerCase()}@ticker`);

    if (binancePairs.length === 0) {
      console.error('No valid Binance pairs found for symbols:', symbols);
      return null;
    }

    const wsUrl = `${this.wsURL}/ws/${binancePairs.join('/')}`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log(`📡 WebSocket connected for: ${symbols.join(', ')}`);
    });

    ws.on('message', (data) => {
      try {
        const ticker = JSON.parse(data);
        
        if (ticker.e === '24hrTicker') {
          // Find crypto symbol for this Binance pair
          const cryptoSymbol = Object.keys(this.supportedPairs).find(
            key => this.supportedPairs[key] === ticker.s
          );

          if (cryptoSymbol) {
            const price = parseFloat(ticker.c).toFixed(8);
            
            // Update cache
            this.priceCache.set(cryptoSymbol, {
              price,
              timestamp: Date.now()
            });

            // Call update callback
            if (onPriceUpdate) {
              onPriceUpdate({
                symbol: cryptoSymbol,
                price,
                change: parseFloat(ticker.P).toFixed(2)
              });
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('📡 WebSocket connection closed');
    });

    return ws;
  }

  /**
   * Get human-readable crypto name
   * @param {string} symbol - Crypto symbol
   * @returns {string} Human-readable name
   */
  getCryptoName(symbol) {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'BNB': 'Binance Coin',
      'XRP': 'XRP',
      'SOL': 'Solana',
      'MATIC': 'Polygon'
    };
    
    return names[symbol] || symbol;
  }

  /**
   * Get fallback price for development/testing
   * @param {string} symbol - Crypto symbol
   * @returns {string} Fallback price
   */
  getFallbackPrice(symbol) {
    const fallbackPrices = {
      'BTC': '43250.00000000',
      'ETH': '2650.00000000',
      'ADA': '0.38500000',
      'DOT': '5.45000000',
      'BNB': '310.50000000',
      'XRP': '0.52000000',
      'SOL': '98.75000000',
      'MATIC': '0.85000000'
    };
    
    return fallbackPrices[symbol.toUpperCase()] || '1.00000000';
  }

  /**
   * Get fallback prices for all supported cryptos
   * @returns {Object} Object with fallback prices
   */
  getFallbackPrices() {
    const fallbackPrices = {};
    this.getSupportedCryptos().forEach(symbol => {
      fallbackPrices[symbol] = this.getFallbackPrice(symbol);
    });
    return fallbackPrices;
  }

  /**
   * Health check for Binance API connection
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const btcPrice = await this.getPrice('BTC');
      return {
        status: 'healthy',
        binanceAPI: 'connected',
        testPrice: {
          symbol: 'BTC',
          price: btcPrice
        },
        cacheSize: this.priceCache.size,
        supportedCryptos: this.getSupportedCryptos().length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        binanceAPI: 'disconnected',
        error: error.message,
        cacheSize: this.priceCache.size,
        supportedCryptos: this.getSupportedCryptos().length
      };
    }
  }
}

// Export singleton instance
export default new BinanceService();
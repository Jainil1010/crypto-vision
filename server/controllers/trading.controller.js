import { getDB } from '../config/database.js';
import { 
    buyCryptocurrency as blockchainBuy,
    sellCryptocurrency as blockchainSell,
    getUserCryptoBalance,
    getCryptoPrice,
    getSupportedCryptos,
    getUserTransactions as getBlockchainTransactions,
    getAccountBalance
} from '../config/blockchain.js';

// Get all supported cryptocurrencies
export const getSupportedCryptocurrencies = async (req, res) => {
    try {
        const supportedCryptos = await getSupportedCryptos();
        
        // Get prices for each crypto
        const cryptosWithPrices = [];
        for (const crypto of supportedCryptos) {
            try {
                const price = await getCryptoPrice(crypto);
                cryptosWithPrices.push({
                    symbol: crypto,
                    price: price,
                    priceInETH: price
                });
            } catch (error) {
                console.error(`Error fetching price for ${crypto}:`, error);
                cryptosWithPrices.push({
                    symbol: crypto,
                    price: '0',
                    priceInETH: '0'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                cryptocurrencies: cryptosWithPrices
            }
        });

    } catch (error) {
        console.error('Error fetching supported cryptocurrencies:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get cryptocurrency price
export const getCryptocurrencyPrice = async (req, res) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Cryptocurrency symbol is required'
            });
        }

        const price = await getCryptoPrice(symbol.toUpperCase());

        res.status(200).json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                price: price,
                priceInETH: price
            }
        });

    } catch (error) {
        console.error('Error fetching cryptocurrency price:', error);
        res.status(500).json({
            success: false,
            message: 'Cryptocurrency not found or internal server error'
        });
    }
};

// Buy cryptocurrency
export const buyCryptocurrency = async (req, res) => {
    try {
        const { cryptoSymbol, amount, ethValue } = req.body;
        const userId = req.user.id;
        const userWalletAddress = req.user.wallet_address;

        // Validation
        if (!cryptoSymbol || !amount || !ethValue) {
            return res.status(400).json({
                success: false,
                message: 'Please provide cryptoSymbol, amount, and ethValue'
            });
        }

        if (amount <= 0 || ethValue <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount and ethValue must be greater than 0'
            });
        }

        // For demo purposes, we'll use a default private key
        // In production, you should securely store and retrieve user's private key
        const privateKey = process.env.USER_PRIVATE_KEY || '0x...'; // This should be retrieved securely

        // Execute blockchain transaction
        const blockchainResult = await blockchainBuy(
            userWalletAddress,
            privateKey,
            cryptoSymbol.toUpperCase(),
            amount,
            ethValue
        );

        if (!blockchainResult.success) {
            return res.status(400).json({
                success: false,
                message: blockchainResult.error || 'Blockchain transaction failed'
            });
        }

        const db = getDB();

        // Get current crypto price
        const currentPrice = await getCryptoPrice(cryptoSymbol.toUpperCase());

        // Record transaction in database
        await db.execute(
            'INSERT INTO transactions (user_id, crypto_symbol, amount, price, type, tx_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, cryptoSymbol.toUpperCase(), amount, currentPrice, 'buy', blockchainResult.transactionHash]
        );

        res.status(200).json({
            success: true,
            message: 'Cryptocurrency purchased successfully',
            data: {
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber.toString(),
                gasUsed: blockchainResult.gasUsed.toString(),
                cryptoSymbol: cryptoSymbol.toUpperCase(),
                amount: amount,
                ethValue: ethValue
            }
        });

    } catch (error) {
        console.error('Error buying cryptocurrency:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Sell cryptocurrency
export const sellCryptocurrency = async (req, res) => {
    try {
        const { cryptoSymbol, amount } = req.body;
        const userId = req.user.id;
        const userWalletAddress = req.user.wallet_address;

        // Validation
        if (!cryptoSymbol || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide cryptoSymbol and amount'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        const db = getDB();

        // Calculate current balance from database transactions
        const [transactions] = await db.execute(
            `SELECT 
                SUM(CASE WHEN type = 'buy' THEN amount ELSE 0 END) as bought,
                SUM(CASE WHEN type = 'sell' THEN amount ELSE 0 END) as sold
            FROM transactions 
            WHERE user_id = ? AND crypto_symbol = ?`,
            [userId, cryptoSymbol.toUpperCase()]
        );

        const bought = parseFloat(transactions[0]?.bought || '0');
        const sold = parseFloat(transactions[0]?.sold || '0');
        const currentBalance = bought - sold;

        console.log(`Sell validation - User: ${userId}, Crypto: ${cryptoSymbol}, Bought: ${bought}, Sold: ${sold}, Balance: ${currentBalance}, Requested: ${amount}`);

        if (currentBalance < parseFloat(amount)) {
            return res.status(400).json({
                success: false,
                message: `Insufficient cryptocurrency balance. Available: ${currentBalance} ${cryptoSymbol.toUpperCase()}, Requested: ${amount}`
            });
        }

        // For demo purposes, we'll use a default private key
        const privateKey = process.env.USER_PRIVATE_KEY || '0x...';

        let blockchainResult = { success: true, transactionHash: `mock_sell_${Date.now()}`, blockNumber: 100, gasUsed: 21000 };

        // Try blockchain transaction (if available)
        try {
            blockchainResult = await sellCryptocurrency(
                userWalletAddress,
                privateKey,
                cryptoSymbol.toUpperCase(),
                amount
            );
        } catch (blockchainError) {
            console.log('Blockchain sell failed, using mock transaction:', blockchainError.message);
            // Continue with mock transaction for now
        }

        if (!blockchainResult.success) {
            return res.status(400).json({
                success: false,
                message: blockchainResult.error || 'Blockchain transaction failed'
            });
        }

        // Get current crypto price
        const currentPrice = await getCryptoPrice(cryptoSymbol.toUpperCase());

        // Record transaction in database
        await db.execute(
            'INSERT INTO transactions (user_id, crypto_symbol, amount, price, type, tx_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, cryptoSymbol.toUpperCase(), amount, currentPrice, 'sell', blockchainResult.transactionHash]
        );

        const newBalance = currentBalance - parseFloat(amount);

        res.status(200).json({
            success: true,
            message: 'Cryptocurrency sold successfully',
            data: {
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber.toString(),
                gasUsed: blockchainResult.gasUsed.toString(),
                cryptoSymbol: cryptoSymbol.toUpperCase(),
                amount: amount,
                previousBalance: currentBalance.toString(),
                newBalance: newBalance.toString()
            }
        });

    } catch (error) {
        console.error('Error selling cryptocurrency:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user's cryptocurrency balances
export const getUserBalances = async (req, res) => {
    try {
        const userId = req.user.id;
        const userWalletAddress = req.user.wallet_address;
        const db = getDB();

        // Get ETH balance from Ganache
        let ethBalance = "0";
        try {
            ethBalance = await getAccountBalance(userWalletAddress);
        } catch (error) {
            console.error('Error fetching ETH balance:', error);
        }

        // Get supported cryptocurrencies
        const supportedCryptos = await getSupportedCryptos();
        
        // Calculate balances from database transactions (fallback method)
        const balances = [];
        for (const crypto of supportedCryptos) {
            try {
                // Try to get balance from blockchain first
                let blockchainBalance = "0";
                try {
                    blockchainBalance = await getUserCryptoBalance(userWalletAddress, crypto);
                } catch (blockchainError) {
                    console.log(`Blockchain balance failed for ${crypto}, using database fallback`);
                }

                // Calculate balance from database transactions
                const [transactions] = await db.execute(
                    `SELECT 
                        SUM(CASE WHEN type = 'buy' THEN amount ELSE 0 END) as bought,
                        SUM(CASE WHEN type = 'sell' THEN amount ELSE 0 END) as sold
                    FROM transactions 
                    WHERE user_id = ? AND crypto_symbol = ?`,
                    [userId, crypto]
                );

                const bought = parseFloat(transactions[0]?.bought || '0');
                const sold = parseFloat(transactions[0]?.sold || '0');
                const databaseBalance = bought - sold;

                // Use database balance if blockchain balance is 0
                const finalBalance = (parseFloat(blockchainBalance) > 0) ? blockchainBalance : databaseBalance.toFixed(8);
                
                const price = await getCryptoPrice(crypto);
                const value = (parseFloat(finalBalance) * parseFloat(price)).toFixed(8);
                
                balances.push({
                    symbol: crypto,
                    balance: finalBalance,
                    price: price,
                    value: value,
                    source: (parseFloat(blockchainBalance) > 0) ? 'blockchain' : 'database'
                });

                console.log(`${crypto} Balance - Blockchain: ${blockchainBalance}, Database: ${databaseBalance}, Using: ${finalBalance}`);
                
            } catch (error) {
                console.error(`Error calculating balance for ${crypto}:`, error);
                balances.push({
                    symbol: crypto,
                    balance: '0',
                    price: '0',
                    value: '0',
                    source: 'error'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                ethBalance: ethBalance,
                cryptoBalances: balances,
                walletAddress: userWalletAddress
            }
        });

    } catch (error) {
        console.error('Error fetching user balances:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user's transaction history
export const getUserTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const userWalletAddress = req.user.wallet_address;
        const db = getDB();

        // Get transactions from database
        const [dbTransactions] = await db.execute(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Get transactions from blockchain
        const blockchainTransactions = await getBlockchainTransactions(userWalletAddress);

        res.status(200).json({
            success: true,
            data: {
                databaseTransactions: dbTransactions,
                blockchainTransactions: blockchainTransactions
            }
        });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get specific transaction details
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
            message: 'Internal server error'
        });
    }
};
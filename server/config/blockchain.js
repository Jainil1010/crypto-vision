import { Web3 } from "web3";
import { config } from "dotenv";
import { CONTRACT_ADDRESS, NETWORK_ID, GAS_PRICE } from "./env.js";
import contractArtifact from '../blockchain/build/contracts/CryptoTradingContract.json' with { type: 'json' };

config();

// Initialize Web3 with Ganache
const web3 = new Web3(process.env.GANACHE_URL || "http://127.0.0.1:7545");

// Contract ABI (will be updated after compilation)
let contractABI = [];
let contractAddress = CONTRACT_ADDRESS;

// Load contract ABI from compiled artifacts
const loadContractABI = async () => {
  try {
    // This will be updated with the actual ABI after contract compilation
    contractABI = contractArtifact.abi;
    contractAddress =
      contractArtifact.networks[NETWORK_ID]?.address ||
      contractAddress;
  } catch (error) {
    console.error("Error loading contract ABI:", error);
  }
};

// Initialize contract
let contract = null;

const initContract = async () => {
  try {
    await loadContractABI();
    if (contractABI.length > 0 && contractAddress) {
      contract = new web3.eth.Contract(contractABI, contractAddress);
      console.log("Blockchain contract initialized successfully");
    } else {
      console.error("Contract ABI or address not available");
    }
  } catch (error) {
    console.error("Error initializing contract:", error);
  }
};

// Get accounts from Ganache
const getAccounts = async () => {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
};

// Get account balance
const getAccountBalance = async (address) => {
  try {
    const balance = await web3.eth.getBalance(address);
    return web3.utils.fromWei(balance, "ether");
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
};

// Buy cryptocurrency on blockchain
const buyCryptocurrency = async (
  userAddress,
  privateKey,
  cryptoSymbol,
  amount,
  ethValue
) => {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const amountInWei = web3.utils.toWei(amount.toString(), "ether");
    const valueInWei = web3.utils.toWei(ethValue.toString(), "ether");

    // Create transaction
    const transaction = contract.methods.buyCryptocurrency(
      cryptoSymbol,
      amountInWei
    );

    // Estimate gas
    const gasEstimate = await transaction.estimateGas({
      from: userAddress,
      value: valueInWei,
    });

    // Sign and send transaction
    const signedTx = await web3.eth.accounts.signTransaction(
      {
        to: contractAddress,
        data: transaction.encodeABI(),
        gas: gasEstimate,
        gasPrice: GAS_PRICE,
        value: valueInWei,
        nonce: await web3.eth.getTransactionCount(userAddress),
      },
      privateKey
    );

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("Error buying cryptocurrency:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Sell cryptocurrency on blockchain
const sellCryptocurrency = async (
  userAddress,
  privateKey,
  cryptoSymbol,
  amount
) => {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const amountInWei = web3.utils.toWei(amount.toString(), "ether");

    // Create transaction
    const transaction = contract.methods.sellCryptocurrency(
      cryptoSymbol,
      amountInWei
    );

    // Estimate gas
    const gasEstimate = await transaction.estimateGas({
      from: userAddress,
    });

    // Sign and send transaction
    const signedTx = await web3.eth.accounts.signTransaction(
      {
        to: contractAddress,
        data: transaction.encodeABI(),
        gas: gasEstimate,
        gasPrice: GAS_PRICE,
        nonce: await web3.eth.getTransactionCount(userAddress),
      },
      privateKey
    );

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("Error selling cryptocurrency:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get user cryptocurrency balance
const getUserCryptoBalance = async (userAddress, cryptoSymbol) => {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const balance = await contract.methods
      .getUserBalance(userAddress, cryptoSymbol)
      .call();
    return web3.utils.fromWei(balance, "ether");
  } catch (error) {
    console.error("Error fetching user crypto balance:", error);
    return "0";
  }
};

// Get cryptocurrency price
const getCryptoPrice = async (cryptoSymbol) => {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const price = await contract.methods.getCryptoPrice(cryptoSymbol).call();
    return web3.utils.fromWei(price, "ether");
  } catch (error) {
    console.error("Error fetching crypto price:", error);
    return "0";
  }
};

// Get supported cryptocurrencies
const getSupportedCryptos = async () => {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const cryptos = await contract.methods.getSupportedCryptos().call();
    return cryptos;
  } catch (error) {
    console.error("Error fetching supported cryptos:", error);
    return [];
  }
};

// Get user transactions from blockchain
const getUserTransactions = async (userAddress) => {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const transactionIds = await contract.methods
      .getUserTransactions(userAddress)
      .call();
    const transactions = [];

    for (const id of transactionIds) {
      const txn = await contract.methods.getTransaction(id).call();
      transactions.push({
        id: txn.id,
        user: txn.user,
        cryptoSymbol: txn.cryptoSymbol,
        amount: web3.utils.fromWei(txn.amount, "ether"),
        price: web3.utils.fromWei(txn.price, "ether"),
        type: txn.transactionType,
        timestamp: txn.timestamp,
        completed: txn.completed,
      });
    }

    return transactions;
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return [];
  }
};

// Create a new wallet account
const createAccount = () => {
  try {
    const account = web3.eth.accounts.create();
    return {
      address: account.address,
      privateKey: account.privateKey,
    };
  } catch (error) {
    console.error("Error creating account:", error);
    return null;
  }
};

// Export blockchain service functions
export {
  web3,
  initContract,
  getAccounts,
  getAccountBalance,
  buyCryptocurrency,
  sellCryptocurrency,
  getUserCryptoBalance,
  getCryptoPrice,
  getSupportedCryptos,
  getUserTransactions,
  createAccount,
};

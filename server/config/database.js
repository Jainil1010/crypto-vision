import mysql from 'mysql2/promise';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } from './env.js';

const dbConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
};

let connection;

export const connectDB = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('MySQL connected successfully');

    // Create users and transactions table if it doesn't exist
    await createUsersTable();
    await createTransactionsTable();

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      wallet_address VARCHAR(42),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await connection.execute(createTableQuery);
    console.log('Users table ready');
  } catch (error) {
    console.error('Error creating users table:', error);
  }
};

const createTransactionsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      crypto_symbol VARCHAR(10) NOT NULL,
      amount DECIMAL(20, 8) NOT NULL,
      price DECIMAL(20, 8) NOT NULL,
      type ENUM('buy', 'sell') NOT NULL,
      tx_hash VARCHAR(66),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await connection.execute(createTableQuery);
    console.log('Transactions table ready');
  } catch (error) {
    console.error('Error creating transactions table:', error);
  }
};

export const getDB = () => connection;
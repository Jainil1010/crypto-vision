import { config } from "dotenv";

config({ path: `.env`});

export const {
  PORT,
  DB_HOST, DB_USER, DB_PASSWORD, DB_NAME,
  JWT_SECRET, JWT_EXPIRE,
  GANACHE_URL, NETWORK_ID, DEPLOYER_PRIVATE_KEY, 
  CONTRACT_ADDRESS, GAS_LIMIT, GAS_PRICE, USER_PRIVATE_KEY
} = process.env;
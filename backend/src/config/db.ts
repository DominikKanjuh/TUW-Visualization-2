/**
 * @fileoverview Database configuration and connection pool setup
 * @module backend/config/db
 */

import dotenv from "dotenv";
import { Pool } from "pg";

/**
 * Load environment variables from .env file
 */
dotenv.config();

/**
 * PostgreSQL connection pool configuration
 * Uses environment variables for secure configuration:
 * - DB_USER: Database user
 * - DB_HOST: Database host
 * - DB_NAME: Database name
 * - DB_PASSWORD: Database password
 * @type {Pool}
 */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

export default pool;

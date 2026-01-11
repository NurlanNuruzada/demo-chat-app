import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment configuration
 */
export const config = {
  port: parseInt(process.env.SERVER_PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || true, 
  nodeEnv: process.env.NODE_ENV || 'development',
};

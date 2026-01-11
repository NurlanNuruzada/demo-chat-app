import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve path to project root (go up from apps/server/src/config to root)
const projectRoot = resolve(__dirname, '../../../..');

// Load .env from project root
const envPath = join(projectRoot, '.env');
const result = dotenv.config({ 
  path: envPath,
  override: false 
});

if (result.error) {
  console.warn(`Warning: Could not load .env file from ${envPath}:`, result.error.message);
} else {
  console.log(`✓ Loaded .env from: ${envPath}`);
}

/**
 * Environment configuration
 */
export const config = {
  port: parseInt(process.env.SERVER_PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN === '*' 
    ? true 
    : process.env.CORS_ORIGIN || true,
  nodeEnv: process.env.NODE_ENV || 'development',
};

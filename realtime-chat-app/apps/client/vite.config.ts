import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve path to project root (go up from apps/client to root)
const projectRoot = resolve(__dirname, '../..');

// Load .env file to get VITE_PORT
import dotenv from 'dotenv';
dotenv.config({ path: resolve(projectRoot, '.env') });


export default defineConfig({
  plugins: [react()],
  envDir: projectRoot, // Load .env from project root
  server: {
    port: parseInt(process.env.VITE_PORT || '5173', 10),
    host: true,
  },
  build: {
    outDir: 'dist',
  },
});

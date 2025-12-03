import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using process.cwd() is safer for Vercel build environments.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Priority: 
  // 1. Vercel System Env (process.env.API_KEY)
  // 2. Loaded .env file (env.API_KEY)
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Google GenAI SDK
      // Ensure it's always a string, even if undefined
      'process.env.API_KEY': JSON.stringify(apiKey || '')
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            genai: ['@google/genai'],
            markdown: ['react-markdown', 'remark-gfm']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  };
});
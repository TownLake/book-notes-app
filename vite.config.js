import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Enable environment variable loading
  define: {
    // Force envVars into a string type
    'process.env.VITE_CF_ACCESS_CLIENT_ID': 
      JSON.stringify(process.env.VITE_CF_ACCESS_CLIENT_ID),
    'process.env.VITE_CF_ACCESS_CLIENT_SECRET': 
      JSON.stringify(process.env.VITE_CF_ACCESS_CLIENT_SECRET),
  }
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE || '/LaunchPad/',
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } }
});

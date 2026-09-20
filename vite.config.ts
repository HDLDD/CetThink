import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 与 NativeThink 相同：出厂 Key 从 scripts/.apikey 注入（gitignore）
let factoryApiKey = '';
try {
  factoryApiKey = fs.readFileSync(path.resolve(__dirname, 'scripts/.apikey'), 'utf8').trim();
} catch {
  factoryApiKey = '';
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __FACTORY_API_KEY__: JSON.stringify(factoryApiKey),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    host: true,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});

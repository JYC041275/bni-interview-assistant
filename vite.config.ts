import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // 使用相對路徑，讓應用可以直接打開 HTML 文件使用
        base: './',
        rollupOptions: {
          output: {
            // 確保資源路徑使用相對路徑
            assetFileNames: 'assets/[name].[ext]',
            entryFileNames: 'assets/[name].js',
            chunkFileNames: 'assets/[name].js',
          }
        }
      }
    };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      host: true,
      // Pasa el dominio exacto en un Array:
     allowedHosts: [
  'pdf-ai-971636503516.us-central1.run.app',
  '.run.app'
]
    },
    preview: {
      allowedHosts: [
  'pdf-ai-971636503516.us-central1.run.app',
  '.run.app'
]
    }
  };
});

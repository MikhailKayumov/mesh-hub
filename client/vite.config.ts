import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = env.PORT && !isNaN(+env.PORT) ? +env.PORT : 8000;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      manifest: true,
    },
    server: {
      open: true,
      port,
      strictPort: true,
      proxy: {
        '/api': {
          ws: false,
          secure: false,
          changeOrigin: true,
          target: env.API_PROXY_URL,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        '/socket.io': {
          target: env.WS_PROXY,
          ws: true,
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/socket.io/, '/socket.io'),
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "./src/theme/_mantine";`,
        },
      },
    },
  };
});

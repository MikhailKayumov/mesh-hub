import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = env.PORT && !isNaN(+env.PORT) ? +env.PORT : 8000;

  return {
    plugins: [
      react({
        // include: '**/Model3DViewer/classes/**/*.(ts|js)x?',
      }),
    ],
    resolve: {
      tsconfigPaths: true,
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
          secure: true,
          changeOrigin: true,
          target: env.API_PROXY_URL,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        // '/socket.io': {
        //   target: env.WS_PROXY,
        //   ws: true,
        //   secure: true,
        //   changeOrigin: true,
        //   rewrite: (path) => path.replace(/^\/socket.io/, '/socket.io'),
        // },
        '/files': {
          ws: false,
          secure: true,
          changeOrigin: true,
          target: env.API_PROXY_URL,
          rewrite: (path) => path.replace(/^\/files/, ''),
        },
      },
    },
    preview: {
      port,
    },
    optimizeDeps: {
      include: ['@tabler/icons-react', 'three', 'camera-controls'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "${path.join(process.cwd(), 'src/shared/theme/_mantine').replace(/\\/g, '/')}" as *;`,
        },
      },
    },
  };
});

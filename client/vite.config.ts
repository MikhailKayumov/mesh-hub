import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
    server: {
      port,
      proxy: {
        [env.VITE_APP_API_URL ?? '/api']: env.API_PROXY_URL,
      },
    },
  };
});

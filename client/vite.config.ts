import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = env.PORT && !isNaN(+env.PORT) ? +env.PORT : 8000;

  return {
    plugins: [
      react({
        babel: { plugins: [['babel-plugin-react-compiler']] },
        // include: '**/Model3DViewer/classes/**/*.(ts|js)x?',
      }),
    ],
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
          secure: true,
          changeOrigin: true,
          target: env.API_PROXY_URL,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        '/socket.io': {
          target: env.WS_PROXY,
          ws: true,
          secure: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/socket.io/, '/socket.io'),
        },
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
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          // additionalData: `@import "/src/shared/theme/_mantine";`,
          additionalData: `
            @use 'sass:math';
            @use 'sass:color';

            // Define variables for your breakpoints,
            // values must be the same as in your theme
            $mantine-breakpoint-xs: '36em'; // 576px
            $mantine-breakpoint-sm: '48em'; // 768px
            $mantine-breakpoint-md: '62em'; // 992px
            $mantine-breakpoint-lg: '75em'; // 1200px
            $mantine-breakpoint-xl: '88em'; // 1408px

            @function rem($value) {
              @return #{math.div(math.div($value, $value * 0 + 1), 16)}rem;
            }
            @mixin light {
              [data-mantine-color-scheme='light'] & {
                @content;
              }
            }
            @mixin dark {
              [data-mantine-color-scheme='dark'] & {
                @content;
              }
            }
            @mixin hover {
              @media (hover: hover) {
                &:hover {
                  @content;
                }
              }
              @media (hover: none) {
                &:active {
                  @content;
                }
              }
            }

            // Add direction mixins if you need rtl support
            @mixin rtl {
              [dir='rtl'] & {
                @content;
              }
            }
            @mixin ltr {
              [dir='ltr'] & {
                @content;
              }
            }
          `,
        },
      },
    },
  };
});

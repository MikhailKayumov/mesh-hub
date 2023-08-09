/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    mySecret: 'secret',
  },
  publicRuntimeConfig: {},
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

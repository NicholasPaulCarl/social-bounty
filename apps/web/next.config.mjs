/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@social-bounty/shared'],
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Isolate PrimeReact into its own chunk — prevents every page from bundling it independently
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          primereact: {
            test: /[\\/]node_modules[\\/](primereact|primeicons)[\\/]/,
            name: 'primereact',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;

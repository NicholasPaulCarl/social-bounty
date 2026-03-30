/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@social-bounty/shared'],
  reactStrictMode: true,
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

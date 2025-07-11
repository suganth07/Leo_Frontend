import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [],
  typescript: {
    // During builds, ignore type errors to prevent build failures
    ignoreBuildErrors: false,
  },
  eslint: {
    // During builds, ignore ESLint errors to prevent build failures
    ignoreDuringBuilds: true,
  },
  // Ensure proper module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Improve module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').join(__dirname, 'src'),
    };
    
    // Add fallbacks for node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;

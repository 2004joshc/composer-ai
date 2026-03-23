/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tone.js requires this to avoid SSR issues
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  // Disable turbopack for font loading issues
  swcMinify: true,
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors and warnings during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

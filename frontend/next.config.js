/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker deployment
    output: 'standalone',

    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
    },

    // Turbopack configuration (Next.js 16+)
    turbopack: {},

    // Webpack configuration
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },

    // Image optimization (updated for Next.js 16)
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

module.exports = nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack dev server config (required by Next.js 16+)
  turbopack: {},

  // Webpack (production build) — alias canvas to false for pdfjs-dist
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }
    return config;
  },

  // Enable gzip compression for all responses
  compress: true,

  // Tree-shake heavy client-side libraries
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "react-icons",
    ],
  },

  // Aggressive cache headers for static assets & images
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
    ];
  },

  images: {
    // SVG support
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",

    // Allowed external image sources
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },

      // ✅ STRAPI IMAGES (IMPORTANT)
      {
        protocol: 'https',
        hostname: 'cms.energdive.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'cms.energdive.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '206.189.132.187',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },

    ],
    qualities: [75, 100],
    unoptimized: false,
  },
};

export default nextConfig;
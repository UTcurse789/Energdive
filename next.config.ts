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
    optimizeCss: true,
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
        source: "/:path*(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|otf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "energdive.com",
          },
        ],
        destination: "https://www.energdive.com/:path*",
        statusCode: 301,
      },
      {
        source: '/login',
        destination: '/auth',
        permanent: true,
      },
      {
        source: '/author',
        destination: '/authors',
        permanent: true,
      },
      {
        source: '/advertise',
        destination: '/advertise-with-us',
        permanent: true,
      },
      {
        source: '/news/delhi-announces-new-ev-policy-to-curb-pollution-expand-charging-network-1',
        destination: '/news/delhi-announces-new-ev-policy-to-curb-pollution-expand-charging-network',
        permanent: true,
      },
      {
        source: '/news/govt-steps-up-ev-charging-rollout-with-tighter-battery-standards-r-and-d-push-1',
        destination: '/news/govt-steps-up-ev-charging-rollout-with-tighter-battery-standards-r-and-d-push',
        permanent: true,
      },
      // Redirect old singular /interview routes to plural /interviews
      {
        source: '/interview',
        destination: '/interviews',
        permanent: true,
      },
      {
        source: '/interview/:slug',
        destination: '/interviews/:slug',
        permanent: true,
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
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: '/**',
      },

      // ✅ STRAPI IMAGES (IMPORTANT)
      {
        protocol: 'https',
        hostname: 'cms.energdive.com',
        pathname: '/**',
      },
      // ✅ CDN IMAGES
      {
        protocol: 'https',
        hostname: 'cdn.energdive.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'cms.energdive.com',
        pathname: '/**',
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
        pathname: '/**',
      },

    ],
    qualities: [75, 100],
    unoptimized: false,
  },
};

export default nextConfig;

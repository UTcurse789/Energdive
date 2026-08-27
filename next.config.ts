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
    // Abstract/final paper uploads allow PDFs up to 20 MB. Keep proxy body cloning
    // above that limit so multipart boundaries are not truncated in dev/proxy.
    proxyClientMaxBodySize: "25mb",
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "react-icons",
      "clsx",
      "tailwind-merge",
      "date-fns",
    ],
  },

  // Cache & Security headers for Best Practices, SEO & Performance
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
        source: "/:all*(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|otf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Global Security & Best Practices headers for all routes
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        // All HTML pages: tell CDN/Cloudflare max 60s stale-while-revalidate.
        source: "/:path*",
        missing: [
          { type: "header", key: "x-no-cache-override" },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=60",
          },
        ],
      },
    ];
  },

  // PostHog reverse proxy — routes PostHog requests through Next.js to avoid ad blockers
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

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
      // Redirect old paper submission route to abstract submission route
      {
        source: '/knowledge-base/submit/paper',
        destination: '/knowledge-base/submit/abstract',
        permanent: true,
      },
      // Redirect non-hyphenated indias slug to correct india-s slug
      {
        source: '/opinion/from-megawatts-to-mindsets-indias-energy-transition-and-the-road-ahead',
        destination: '/opinion/from-megawatts-to-mindsets-india-s-energy-transition-and-the-road-ahead',
        permanent: true,
      },
      // Redirect old /energjob routes to new /energyjobs routes
      {
        source: '/energjob',
        destination: '/energyjobs',
        permanent: true,
      },
      {
        source: '/energjob/jobs',
        destination: '/energyjobs',
        permanent: true,
      },
      {
        source: '/energjob/jobs/:slug',
        destination: '/energyjobs/:slug',
        permanent: true,
      },
      {
        source: '/energjob/applications/:token',
        destination: '/energyjobs/applications/:token',
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

    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 768, 828, 1024, 1200, 1440],
    imageSizes: [16, 32, 48, 64, 96, 112, 128, 160, 192, 256, 320, 384, 512],

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
      {
        protocol: 'https',
        hostname: 'cms-staging.energdive.com',
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
    qualities: [75, 80, 100],
    unoptimized: false,
  },
};

export default nextConfig;

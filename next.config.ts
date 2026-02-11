import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 1. SVG Errors fix karne ke liye ye zaroori hai
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // 2. Saare domains ko ek hi array mein daal do
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
    ],
  },
};

export default nextConfig;
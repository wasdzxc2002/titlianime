import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RAM-safety: never let lint/typecheck pile onto compile pressure.
  // The dev script also caps Node heap at 3 GB — see package.json.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,

  turbopack: {
    root: __dirname,
  },

  images: {
    unoptimized: false,
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [48, 96, 160, 240, 320, 480],
    qualities: [55, 60, 65, 70, 75, 85],
    minimumCacheTTL: 60 * 60 * 24,
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "myanimelist.net" },
      { protocol: "https", hostname: "*.myanimelist.net" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "media.kitsu.io" },
      { protocol: "https", hostname: "img.anili.st" },
      { protocol: "https", hostname: "gogocdn.net" },
      { protocol: "https", hostname: "img.flawlessfiles.com" },
      { protocol: "https", hostname: "www.animenewsnetwork.com" },
      { protocol: "https", hostname: "*.animenewsnetwork.com" },
      { protocol: "https", hostname: "media.graphassets.com" },
      { protocol: "https", hostname: "artworks.thetvdb.com" },
      { protocol: "https", hostname: "*.anilist.co" },
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

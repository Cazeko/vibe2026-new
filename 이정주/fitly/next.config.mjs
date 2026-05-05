/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "market-orientation-signal-infectious.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Vercel 기본은 Node runtime — postgres-js, drizzle, pdf-parse 등 Node 패키지가 그대로 작동.
  // Cloudflare Pages edge 호환을 위한 webpack fallback / externals 는 d24 에서 제거.
  // Cloudflare 로 다시 가는 경우 헌법 v2.1 + 미래 옵션 2(OpenNext)에서 재도입.
  serverExternalPackages: ["postgres", "drizzle-orm"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

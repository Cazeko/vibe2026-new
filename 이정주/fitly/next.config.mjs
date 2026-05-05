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
  // Cloudflare Pages edge runtime — Node 코어 모듈은 wrangler.toml 의 nodejs_compat 으로 런타임 polyfill.
  // 빌드 시점 webpack 은 fallback false 로 정적 require 우회.
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        stream: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        // postgres-js, drizzle 등의 추가 Node 코어 의존
        perf_hooks: false,
        os: false,
        util: false,
        events: false,
        buffer: false,
        querystring: false,
        async_hooks: false,
        dgram: false,
        assert: false,
        cluster: false,
        worker_threads: false,
      };
    }
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

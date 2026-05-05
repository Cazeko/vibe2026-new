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
  // postgres-js 같은 Node 전용 패키지는 serverExternalPackages 로 webpack 번들 제외.
  serverExternalPackages: ["postgres", "drizzle-orm"],
  webpack: (config) => {
    // 조건 제거 — 모든 server pass(edge 포함) 에 fallback 적용
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
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
      module: false,
      vm: false,
      v8: false,
      readline: false,
      string_decoder: false,
      timers: false,
      tty: false,
      constants: false,
    };
    // postgres 자체를 webpack externals 로 (런타임에 nodejs_compat 처리)
    const externals = Array.isArray(config.externals) ? config.externals : [];
    config.externals = [...externals, "postgres"];
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin workspace root to this directory (prevents lockfile confusion)
  outputFileTracingRoot: path.join(__dirname),

  // Pre-existing eslint-config-next / ESLint 9 flat-config incompatibility.
  // Type-check still runs via `tsc --noEmit` in CI.
  eslint: { ignoreDuringBuilds: true },

  // Telegram Mini Apps run inside an iframe on web.telegram.org. `X-Frame-Options`
  // has no valid "allow all" value, so we use CSP `frame-ancestors` to permit only
  // Telegram (and self). Native Telegram clients use a webview, not an iframe, so
  // they are unaffected by this header.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://*.t.me",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

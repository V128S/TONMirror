import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin workspace root to this directory (prevents lockfile confusion)
  outputFileTracingRoot: path.join(__dirname),

  // Telegram Mini Apps run inside an iframe
  async headers() {
    return [
      {
        source:  "/(.*)",
        headers: [{ key: "X-Frame-Options", value: "ALLOWALL" }],
      },
    ];
  },
};

export default nextConfig;

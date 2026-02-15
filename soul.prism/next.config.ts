import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // DANGER: This will ignore ALL TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

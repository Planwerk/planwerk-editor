import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mdxeditor/editor"],
  serverExternalPackages: ["node-pty"],
};

export default nextConfig;

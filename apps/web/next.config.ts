import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@oxagen-arp/kernel", "@oxagen-arp/fixtures"],
  typedRoutes: true,
};

export default config;

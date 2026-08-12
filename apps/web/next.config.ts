import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@aep/agent",
    "@aep/contracts",
    "@aep/db",
    "@aep/retrieval",
    "@aep/connectors",
  ],
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;

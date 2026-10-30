import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./public/fonts/**/*'],
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;

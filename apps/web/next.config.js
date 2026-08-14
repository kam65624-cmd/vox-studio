/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vox/ui", "@vox/contracts"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

module.exports = nextConfig;

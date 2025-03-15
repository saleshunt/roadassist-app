/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // This tells Next.js to not treat ESLint warnings as errors during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This ensures TypeScript errors don't fail your build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 
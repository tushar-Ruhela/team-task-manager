/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @ttm/types is a pure TypeScript types package — no transpilation needed
  // It's resolved at build time via pnpm workspace
  experimental: {
    // Ensure workspace packages are bundled correctly
    externalDir: true,
  },
};

module.exports = nextConfig;

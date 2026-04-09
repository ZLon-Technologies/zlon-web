/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    nodeMiddleware: true
  },
  reactStrictMode: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["brand.inkloom.internal", "localhost"],
  },
};

export default nextConfig;

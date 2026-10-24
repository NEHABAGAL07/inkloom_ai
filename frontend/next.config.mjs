/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    domains: ["brand.inkloom.internal", "localhost"],
  },
};

export default nextConfig;

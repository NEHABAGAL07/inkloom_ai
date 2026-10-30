import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.platform === "win32") {
  try {
    const fixScript = path.resolve(__dirname, "compat/windows-fs-fix.cjs").replace(/\\/g, "/");
    if (!process.env.NODE_OPTIONS?.includes("windows-fs-fix.cjs")) {
      process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ""} --require "${fixScript}"`.trim();
    }
  } catch {}
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "brand.inkloom.internal",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
    ],
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
      "https://inkloom-ai.onrender.com";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/content",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

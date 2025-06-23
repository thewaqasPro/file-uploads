import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shadcnblocks.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "https://assets.tailwindcss.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kajabi-storefronts-production.kajabi-cdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.tailwindcss.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "goodguitarist.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kajabi-storefronts-production.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "console-minio.waqas.pro",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

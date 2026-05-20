import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  webpack(config) {    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
  turbopack: {
    root: projectRoot,
    rules: {        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  
};

export default nextConfig;

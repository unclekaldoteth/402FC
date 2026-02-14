import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const stacksConnectShimPath = path.join(__dirname, 'src/lib/stacks-connect-shim.js');

function hasStacksConnectPackage() {
  try {
    require.resolve('@stacks/connect');
    return true;
  } catch (error) {
    return false;
  }
}

const hasStacksConnect = hasStacksConnectPackage();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'crests.football-data.org',
      },
    ],
  },
  webpack: (config) => {
    if (!hasStacksConnect) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['@stacks/connect'] = stacksConnectShimPath;
    }
    return config;
  },
  turbopack: {
    root: __dirname,
    ...(hasStacksConnect
      ? {}
      : {
          resolveAlias: {
            '@stacks/connect': stacksConnectShimPath,
          },
        }),
  },
};

export default nextConfig;

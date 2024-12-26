import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/show',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

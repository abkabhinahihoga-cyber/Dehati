import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images:{
    remotePatterns:[
      {hostname:"lh3.googleusercontent.com"},
      {hostname:"images.unsplash.com"},
      {hostname:"res.cloudinary.com"}
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default withNextIntl(nextConfig);

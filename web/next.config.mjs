/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN;
    if (!apiOrigin) {
      return [];
    }
    // beforeFiles makes the API win over the legacy route handlers that still exist under src/app/api.
    return {
      beforeFiles: [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }],
    };
  },
};

export default nextConfig;

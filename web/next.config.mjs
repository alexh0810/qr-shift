/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiOrigin = (process.env.API_ORIGIN ?? "http://127.0.0.1:8080").replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;

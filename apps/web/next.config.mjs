const config = {
  reactStrictMode: true,
  transpilePackages: ["@empire/ui", "@empire/api-contract", "@empire/batteries-world-monitor"],
  output: "standalone",
  env: { NEXT_PUBLIC_API_ORIGIN: "/api" },
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:4000" : "http://api:4000");
    return [{ source: "/api/:path*", destination: `${apiOrigin.replace(/\/$/, "")}/:path*` }];
  },
};

export default config;

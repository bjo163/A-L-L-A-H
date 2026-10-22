const config = {
  reactStrictMode: true,
  transpilePackages: ["@empire/ui"],
  output: "standalone",
  env: { NEXT_PUBLIC_API_ORIGIN: process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:4000" },
};
export default config;

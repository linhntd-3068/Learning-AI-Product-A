import type { NextConfig } from "next";

// Cache Components is off on purpose: every screen and API route sits behind login and reads per-user data
// from Supabase, so there is nothing to prerender or cache, and request-time rendering keeps auth simple.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

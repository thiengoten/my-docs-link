import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dashboard routes are dynamic (auth-gated), so the client router cache
    // defaults to 0s — every tab switch re-fetches and flashes loading.tsx
    // even with no mutation. Server Actions already call revalidatePath()
    // to bust this cache on real writes, so a short reuse window here just
    // stops redundant loading flashes on unchanged data.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;

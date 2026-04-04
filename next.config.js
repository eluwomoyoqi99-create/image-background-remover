/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSR 模式，支持 API Routes（PayPal 支付、NextAuth、Webhook）
  // 由 @opennextjs/cloudflare 适配到 Cloudflare Pages
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

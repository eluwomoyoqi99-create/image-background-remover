/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除 output: 'export'，改为服务端渲染模式
  // 原因：接入 API Routes（PayPal 支付、NextAuth、Webhook）需要 Node.js 运行时
  // Cloudflare Pages 请改用 @cloudflare/next-on-pages 适配器
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

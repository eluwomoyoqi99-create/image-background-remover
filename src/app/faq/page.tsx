'use client';

export default function FAQPage() {
  const faqs = [
    {
      q: "免费用户和 Pro 用户有什么区别？",
      a: "免费用户每天限制 10 次，Pro 用户无限次数，且支持 4K 高清无水印输出。"
    },
    {
      q: "如何计算每日使用次数？",
      a: "每天 UTC 0:00 重置，未登录用户限制 3 次，注册用户 10 次。"
    },
    {
      q: "支持哪些支付方式？",
      a: "支持信用卡、PayPal、支付宝、微信支付。"
    },
    {
      q: "可以随时取消订阅吗？",
      a: "可以，取消后当前周期结束前仍可使用 Pro 功能。"
    },
    {
      q: "图片会被保存吗？",
      a: "不会，所有图片在内存中处理，处理完成后立即删除。"
    },
    {
      q: "支持批量处理吗？",
      a: "Pro 用户支持一次上传最多 50 张图片批量处理。"
    },
    {
      q: "有 API 接口吗？",
      a: "Pro 用户可以申请 API Key，每月 10,000 次调用额度。"
    },
    {
      q: "支持退款吗？",
      a: "购买后 7 天内如不满意可全额退款。"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">常见问题</h1>
          <p className="text-lg text-gray-500">快速找到您需要的答案</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-200">
          {faqs.map((faq, i) => (
            <details key={i} className="group p-6">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-lg font-semibold text-gray-900">{faq.q}</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}

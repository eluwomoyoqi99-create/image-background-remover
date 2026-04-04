'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      name: "访客",
      price: "免费",
      period: "",
      features: [
        "每天 3 次使用",
        "最大 1080p 输出",
        "基础处理速度",
        "无历史记录"
      ],
      cta: "开始使用",
      href: "/",
      highlight: false,
      planType: null
    },
    {
      name: "免费用户",
      price: "免费",
      period: "",
      features: [
        "每天 10 次使用",
        "最大 2K 输出",
        "30 天历史记录",
        "批量下载 5 张"
      ],
      cta: "免费注册",
      href: "/",
      highlight: false,
      planType: null
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/月",
      features: [
        "无限次数使用",
        "4K 高清输出",
        "无水印下载",
        "批量处理 50 张",
        "API 访问权限",
        "优先处理速度",
        "永久历史记录"
      ],
      cta: "立即升级",
      href: "#",
      highlight: true,
      planType: "pro_monthly"
    }
  ];

  const handleSubscribe = async (planType: string, label: string) => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }
    setLoading(planType);
    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });
      const data = await res.json();
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        alert('创建订阅失败，请重试');
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">选择适合您的方案</h1>
          <p className="text-lg text-gray-500">灵活的定价，满足不同需求</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-8 ${
                plan.highlight
                  ? 'ring-2 ring-indigo-600 shadow-xl scale-105'
                  : 'shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="bg-indigo-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  推荐
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.planType ? (
                <button
                  onClick={() => handleSubscribe(plan.planType!, plan.cta)}
                  disabled={loading === plan.planType}
                  className={`block w-full py-3 px-6 rounded-xl text-center font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {loading === plan.planType ? '跳转中...' : plan.cta}
                </button>
              ) : (
                <a
                  href={plan.href}
                  className={`block w-full py-3 px-6 rounded-xl text-center font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">年付优惠</h2>
          <p className="text-gray-600 mb-4">
            选择年付方案，立省 <span className="text-indigo-600 font-bold">33%</span>
          </p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            $79.99 <span className="text-lg text-gray-500 line-through">$119.88</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">相当于每月仅需 $6.67</p>
          <button
            onClick={() => handleSubscribe('pro_yearly', '选择年付方案')}
            disabled={loading === 'pro_yearly'}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading === 'pro_yearly' ? '跳转中...' : '选择年付方案'}
          </button>
        </div>
      </main>
    </div>
  );
}

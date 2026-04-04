'use client'
// src/app/payment/failed/page.tsx

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentFailedPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/pricing')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-12 shadow-sm text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">支付失败</h1>
        <p className="text-gray-500 mb-6">请重试，或联系客服。即将返回定价页面…</p>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-red-400 h-1.5 rounded-full animate-[shrink_5s_linear_forwards]" />
        </div>
        <p className="text-sm text-gray-400 mt-3">5 秒后自动跳转</p>
        <button
          onClick={() => router.push('/pricing')}
          className="mt-6 text-indigo-600 hover:underline text-sm"
        >
          立即返回
        </button>
      </div>
    </div>
  )
}

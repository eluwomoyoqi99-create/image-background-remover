'use client'
// src/components/PayPalButtons.tsx
// 积分包一次性支付按钮组件

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useRouter } from 'next/navigation'

interface CreditPackage {
  id: string
  credits: number
  amount: string
  label: string
}

interface Props {
  pkg: CreditPackage
}

export function CreditPackageButton({ pkg }: Props) {
  const router = useRouter()

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: 'USD',
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical', color: 'blue', shape: 'rect' }}
        createOrder={async () => {
          const res = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageId: pkg.id }),
          })
          const data = await res.json()
          return data.orderId
        }}
        onApprove={async (data) => {
          await fetch('/api/payment/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          })
          router.push('/payment/success')
        }}
        onError={() => {
          router.push('/payment/failed')
        }}
        onCancel={() => {
          router.push('/payment/failed')
        }}
      />
    </PayPalScriptProvider>
  )
}

// ---- 订阅按钮组件 ----
interface SubscriptionButtonProps {
  planType: 'pro_monthly' | 'pro_yearly'
  label: string
}

export function SubscriptionButton({ planType, label }: SubscriptionButtonProps) {
  const router = useRouter()

  const handleSubscribe = async () => {
    const res = await fetch('/api/subscription/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType }),
    })
    const data = await res.json()

    if (data.approveUrl) {
      // 跳转到 PayPal 完成订阅
      window.location.href = data.approveUrl
    } else {
      router.push('/payment/failed')
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
    >
      {label}
    </button>
  )
}

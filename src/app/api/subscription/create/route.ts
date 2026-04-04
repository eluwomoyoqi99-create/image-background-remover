// src/app/api/subscription/create/route.ts
// 创建 PayPal 订阅

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSubscription } from '@/lib/paypal'

const PLAN_MAP: Record<string, { planId: string; plan: 'PRO_MONTHLY' | 'PRO_YEARLY' }> = {
  pro_monthly: {
    planId: process.env.PAYPAL_PLAN_ID_PRO_MONTHLY!,
    plan: 'PRO_MONTHLY',
  },
  pro_yearly: {
    planId: process.env.PAYPAL_PLAN_ID_PRO_YEARLY!,
    plan: 'PRO_YEARLY',
  },
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { planType } = await req.json()
  const planConfig = PLAN_MAP[planType]

  if (!planConfig) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const subscription = await createSubscription(planConfig.planId)

    // 返回 PayPal 审批链接，前端跳转到 PayPal 完成支付
    const approveLink = subscription.links?.find(
      (l: { rel: string; href: string }) => l.rel === 'approve'
    )?.href

    return NextResponse.json({
      subscriptionId: subscription.id,
      approveUrl: approveLink,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

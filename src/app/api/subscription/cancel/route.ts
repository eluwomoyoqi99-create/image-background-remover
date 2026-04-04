// src/app/api/subscription/cancel/route.ts
// 取消当前用户订阅

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelSubscription } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.subscriptionId || user.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    await cancelSubscription(user.subscriptionId)

    // 状态更新由 Webhook BILLING.SUBSCRIPTION.CANCELLED 事件处理
    // 这里仅返回成功，告知用户取消请求已提交
    return NextResponse.json({ success: true, message: '订阅将在当前计费周期结束后失效' })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}

// src/app/api/payment/create-order/route.ts
// 创建积分包一次性支付订单

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

// 积分包配置
const CREDIT_PACKAGES = [
  { id: 'basic', credits: 100, amount: '9.90', label: '基础包' },
  { id: 'standard', credits: 500, amount: '39.90', label: '标准包' },
  { id: 'pro', credits: 1200, amount: '79.90', label: '专业包' },
]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { packageId } = await req.json()
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!pkg) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
  }

  try {
    const order = await createOrder(pkg.amount, pkg.credits)

    // 创建待支付订单记录
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (user) {
      await prisma.order.create({
        data: {
          userId: user.id,
          paypalOrderId: order.id,
          amount: parseFloat(pkg.amount),
          credits: pkg.credits,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

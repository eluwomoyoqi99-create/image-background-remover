// src/app/api/payment/capture-order/route.ts
// Capture 订单，确认付款并增加积分

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { captureOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId } = await req.json()

  try {
    const capture = await captureOrder(orderId)

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const captureId = capture.purchase_units[0].payments.captures[0].id

    // 查找订单并更新状态（幂等：只处理 PENDING 状态的订单）
    const order = await prisma.order.findUnique({
      where: { paypalOrderId: orderId },
    })

    if (!order || order.status !== 'PENDING') {
      return NextResponse.json({ success: true }) // 幂等返回
    }

    await prisma.$transaction([
      // 更新订单状态
      prisma.order.update({
        where: { paypalOrderId: orderId },
        data: {
          status: 'COMPLETED',
          paypalCaptureId: captureId,
        },
      }),
      // 增加用户积分
      prisma.user.update({
        where: { email: session.user.email },
        data: {
          credits: { increment: order.credits },
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Capture order error:', error)
    return NextResponse.json({ error: 'Failed to capture order' }, { status: 500 })
  }
}

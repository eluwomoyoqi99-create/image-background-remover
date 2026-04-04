// src/app/api/webhooks/paypal/route.ts
// PayPal Webhook 事件处理入口

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // 验证签名
  const headers: Record<string, string> = {
    'paypal-auth-algo': req.headers.get('paypal-auth-algo') || '',
    'paypal-cert-url': req.headers.get('paypal-cert-url') || '',
    'paypal-transmission-id': req.headers.get('paypal-transmission-id') || '',
    'paypal-transmission-sig': req.headers.get('paypal-transmission-sig') || '',
    'paypal-transmission-time': req.headers.get('paypal-transmission-time') || '',
  }

  const isValid = await verifyWebhookSignature(headers, rawBody)
  if (!isValid) {
    console.error('Invalid PayPal webhook signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const eventType = event.event_type
  const resource = event.resource

  console.log(`PayPal Webhook: ${eventType}`, resource.id)

  try {
    switch (eventType) {
      // ---- 订阅事件 ----

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // 订阅激活，开通 Pro 权限
        const sub = await prisma.subscription.findUnique({
          where: { paypalSubscriptionId: resource.id },
        })
        if (sub && sub.status !== 'ACTIVE') {
          await prisma.$transaction([
            prisma.subscription.update({
              where: { paypalSubscriptionId: resource.id },
              data: { status: 'ACTIVE' },
            }),
            prisma.user.update({
              where: { id: sub.userId },
              data: {
                subscriptionId: resource.id,
                subscriptionStatus: 'ACTIVE',
              },
            }),
          ])
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.RENEWED': {
        // 续费成功，延续权限
        const sub = await prisma.subscription.findUnique({
          where: { paypalSubscriptionId: resource.id },
        })
        if (sub) {
          const newPeriodEnd = new Date(resource.billing_info?.next_billing_time)
          await prisma.subscription.update({
            where: { paypalSubscriptionId: resource.id },
            data: { periodEnd: newPeriodEnd },
          })
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        // 取消订阅，标记 CANCELLED（到期后自动失效）
        const sub = await prisma.subscription.findUnique({
          where: { paypalSubscriptionId: resource.id },
        })
        if (sub) {
          await prisma.$transaction([
            prisma.subscription.update({
              where: { paypalSubscriptionId: resource.id },
              data: { status: 'CANCELLED' },
            }),
            prisma.user.update({
              where: { id: sub.userId },
              data: { subscriptionStatus: 'CANCELLED' },
            }),
          ])
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        // 扣费失败，暂停 Pro 权限
        const sub = await prisma.subscription.findUnique({
          where: { paypalSubscriptionId: resource.id },
        })
        if (sub) {
          await prisma.user.update({
            where: { id: sub.userId },
            data: { subscriptionStatus: 'EXPIRED' },
          })
        }
        break
      }

      // ---- 一次性支付事件 ----

      case 'PAYMENT.CAPTURE.COMPLETED': {
        // 付款成功（Webhook 二次确认，幂等处理）
        const orderId = resource.supplementary_data?.related_ids?.order_id
        if (orderId) {
          const order = await prisma.order.findUnique({
            where: { paypalOrderId: orderId },
          })
          if (order && order.status === 'PENDING') {
            await prisma.$transaction([
              prisma.order.update({
                where: { paypalOrderId: orderId },
                data: { status: 'COMPLETED', paypalCaptureId: resource.id },
              }),
              prisma.user.update({
                where: { id: order.userId },
                data: { credits: { increment: order.credits } },
              }),
            ])
          }
        }
        break
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        // 付款失败
        const orderId = resource.supplementary_data?.related_ids?.order_id
        if (orderId) {
          await prisma.order.updateMany({
            where: { paypalOrderId: orderId, status: 'PENDING' },
            data: { status: 'FAILED' },
          })
        }
        break
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        // 退款完成，扣除积分
        const order = await prisma.order.findFirst({
          where: { paypalCaptureId: resource.id },
        })
        if (order && order.status !== 'REFUNDED') {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'REFUNDED' },
            }),
            prisma.user.update({
              where: { id: order.userId },
              data: { credits: { decrement: order.credits } },
            }),
          ])
        }
        break
      }

      default:
        console.log(`Unhandled event: ${eventType}`)
    }
  } catch (error) {
    console.error(`Webhook handler error for ${eventType}:`, error)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

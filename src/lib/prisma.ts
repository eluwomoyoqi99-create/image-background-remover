// src/lib/prisma.ts
// Prisma Client - 支持 Cloudflare D1 和本地 SQLite

import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

declare global {
  var __prisma: PrismaClient | undefined
}

// 本地开发：使用标准 PrismaClient（SQLite file）
// Cloudflare D1：通过 PrismaD1 适配器
export function getPrismaClient(d1?: D1Database): PrismaClient {
  if (d1) {
    // Cloudflare Workers/Pages 环境
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter } as any)
  }

  // 本地开发
  if (!global.__prisma) {
    global.__prisma = new PrismaClient()
  }
  return global.__prisma
}

// 默认导出（本地开发用）
export const prisma = getPrismaClient()

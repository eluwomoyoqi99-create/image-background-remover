// src/lib/prisma.ts
// Prisma Client - 支持 Cloudflare D1 和本地 SQLite

import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

// 引入 Cloudflare Workers 类型
/// <reference types="@cloudflare/workers-types" />

declare global {
  var __prisma: PrismaClient | undefined
}

type D1DB = typeof globalThis extends { DB: infer T } ? T : unknown

export function getPrismaClient(d1?: D1DB): PrismaClient {
  if (d1) {
    const adapter = new PrismaD1(d1 as any)
    return new PrismaClient({ adapter } as any)
  }
  if (!global.__prisma) {
    global.__prisma = new PrismaClient()
  }
  return global.__prisma
}

export const prisma = getPrismaClient()

// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions, DefaultSession } from 'next-auth'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

function buildAuthOptions(): NextAuthOptions {
  // 尝试从 Cloudflare 上下文获取环境变量，失败则 fallback 到 process.env
  let env: Record<string, string> = {}
  let db: any = null
  try {
    const ctx = getCloudflareContext()
    env = (ctx as any).env || {}
    db = env.DB
  } catch {
    // 本地开发环境，使用 process.env
  }

  const googleClientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''

  // 创建 Prisma Client（带 D1 或不带）
  let prismaClient: PrismaClient
  if (db) {
    const adapter = new PrismaD1(db)
    prismaClient = new PrismaClient({ adapter } as any)
  } else {
    prismaClient = new PrismaClient()
  }

  return {
    providers: [
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      }),
    ],
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub
        }
        return session
      },
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id
        }
        return token
      },
    },
    pages: {
      signIn: '/api/auth/signin',
    },
  }
}

const handler = NextAuth(buildAuthOptions())
export { handler as GET, handler as POST }

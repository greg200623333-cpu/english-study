import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

export type UserSession = {
  id: string
  username: string
}

// 延迟获取 SECRET，避免构建时检查
function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('[session] SESSION_SECRET 未配置。请在 .env.local 中设置该变量后再启动服务。')
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(session: UserSession, expiresIn = '30d'): Promise<string> {
  const SECRET = getSecret()
  return await new SignJWT({ id: session.id, username: session.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET)
}

export async function getSession(): Promise<UserSession | null> {
  const SECRET = getSecret()
  const cookieStore = await cookies()
  const token = cookieStore.get('user_session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    const id = payload['id']
    const username = payload['username']
    if (typeof id !== 'string' || typeof username !== 'string') return null
    return { id, username }
  } catch {
    return null
  }
}

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

export type UserSession = {
  id: string
  username: string
}

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback-secret-change-in-production'
)

export async function createSessionToken(session: UserSession, expiresIn = '30d'): Promise<string> {
  return await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET)
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as UserSession
  } catch {
    return null
  }
}

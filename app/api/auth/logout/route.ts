import { NextResponse } from 'next/server'

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('user_session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  })
  return response
}

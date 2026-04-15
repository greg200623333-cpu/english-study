import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  return NextResponse.json({ user: session })
}

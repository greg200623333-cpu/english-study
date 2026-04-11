import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionToken } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password, rememberMe } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: user } = await supabase
    .from('profiles')
    .select('id, username, password_hash')
    .eq('username', username)
    .single()

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  const isRemember = Boolean(rememberMe)
  const token = await createSessionToken({ id: user.id, username: user.username }, isRemember ? '15d' : '1d')
  const response = NextResponse.json({ success: true, userId: user.id })
  const isSecure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'
  response.cookies.set('user_session', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    ...(isRemember ? { maxAge: 60 * 60 * 24 * 15 } : {}),
    path: '/',
  })
  return response
}

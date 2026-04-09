import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionToken } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return NextResponse.json({ error: '用户名只能包含字母和数字，3-20位' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
  }

  const supabase = await createClient()

  // 检查用户名是否已存在
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (existing) {
    return NextResponse.json({ error: '用户名已被占用' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // 创建用户
  const { data: user, error } = await supabase
    .from('profiles')
    .insert({ username, password_hash: passwordHash })
    .select('id, username')
    .single()

  if (error) {
    console.error('注册失败详细错误:', error)
    return NextResponse.json({ error: `注册失败: ${error.message}` }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: '注册失败，未返回用户数据' }, { status: 500 })
  }

  // 设置签名 session cookie
  const token = await createSessionToken({ id: user.id, username: user.username })
  const response = NextResponse.json({ success: true, userId: user.id })
  response.cookies.set('user_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}

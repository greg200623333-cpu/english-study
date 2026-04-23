import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { password } = await request.json()
    if (!password || password.length < 6) {
      return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const supabase = await createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ password_hash: passwordHash })
      .eq('id', session.id)

    if (error) {
      return NextResponse.json({ error: '密码修改失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

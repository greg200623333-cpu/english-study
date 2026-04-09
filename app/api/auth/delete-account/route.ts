import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    await Promise.all([
      supabase.from('study_mode_events').delete().eq('user_id', session.id),
      supabase.from('study_mode_profiles').delete().eq('user_id', session.id),
      supabase.from('quiz_records').delete().eq('user_id', session.id),
      supabase.from('word_records').delete().eq('user_id', session.id),
      supabase.from('essays').delete().eq('user_id', session.id),
    ])
    await supabase.from('profiles').delete().eq('id', session.id)

    const response = NextResponse.json({ success: true })
    response.cookies.set('user_session', '', { maxAge: 0, path: '/' })
    return response
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

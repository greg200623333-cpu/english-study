import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 防御性初始化：构建时使用占位符，运行时严格校验
  if (!url || !key) {
    // 如果是构建阶段（没有真实请求），使用占位符
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.warn('[Supabase] Using placeholder values during build')
      return createServerClient(
        'https://placeholder.supabase.co',
        'placeholder-key',
        {
          cookies: {
            getAll: () => [],
            setAll: () => {},
          },
        }
      )
    }
    // 运行时严格校验
    throw new Error('Supabase URL and ANON_KEY must be configured')
  }

  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}

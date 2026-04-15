import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 防御性初始化：构建时使用占位符
  if (!url || !key) {
    // 构建阶段使用占位符
    if (typeof window === 'undefined') {
      console.warn('[Supabase Client] Using placeholder values during build')
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
    }
    // 浏览器运行时严格校验
    throw new Error('Supabase URL and ANON_KEY must be configured')
  }

  return createBrowserClient(url, key)
}

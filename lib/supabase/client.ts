import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

 
  if (!url || !key) {
   
    if (typeof window === 'undefined') {
      console.warn('[Supabase Client] Using placeholder values during build')
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
    }
   
    throw new Error('Supabase URL and ANON_KEY must be configured')
  }

  return createBrowserClient(url, key)
}

export async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/session', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) {
      
      if (res.status === 401) {
        return null
      }
      console.warn(`[auth] Unexpected status ${res.status} from /api/auth/session`)
      return null
    }
    const { user } = await res.json()
    return user as { id: string; username: string; email?: string } | null
  } catch (error) {
    console.error('[auth] Failed to get current user:', error)
    return null
  }
}

export async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/session')
    if (!res.ok) return null
    const { user } = await res.json()
    return user as { id: string; username: string } | null
  } catch {
    return null
  }
}

'use client'
import { useEffect, useState } from 'react'

export type UserSession = {
  id: string
  username: string
}

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        setSession(data.user)
      } else {
        setSession(null)
      }
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  return { session, loading, refresh: checkSession }
}

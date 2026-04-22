'use client'

const VERSION_KEY = 'app_version'
const BUILD_TIME_KEY = 'app_build_time'

export function checkVersion(): void {
  if (typeof window === 'undefined') return

  const currentVersion = process.env.NEXT_PUBLIC_BUILD_ID
  const currentBuildTime = process.env.NEXT_PUBLIC_BUILD_TIME

  if (!currentVersion) {
    console.warn('[Version] NEXT_PUBLIC_BUILD_ID not set')
    return
  }

  const storedVersion = localStorage.getItem(VERSION_KEY)

  if (storedVersion !== currentVersion) {
    console.log(`[Version] Version mismatch: ${storedVersion} -> ${currentVersion}`)
    clearCacheData()
    localStorage.setItem(VERSION_KEY, currentVersion)
    if (currentBuildTime) {
      localStorage.setItem(BUILD_TIME_KEY, currentBuildTime)
    }
    console.log('[Version] Cache cleared, version updated')
  }
}

function clearCacheData(): void {
  const keysToPreserve = [
    'user_preferences',
    'theme',
    'language',
    'audio_settings',
  ]

  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && !keysToPreserve.includes(key) && key !== VERSION_KEY && key !== BUILD_TIME_KEY) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    console.log(`[Version] Removed cache key: ${key}`)
  })
}

export function getCurrentVersion(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(VERSION_KEY)
}

export function getBuildInfo(): { version: string | null; buildTime: string | null } {
  if (typeof window === 'undefined') return { version: null, buildTime: null }
  return {
    version: localStorage.getItem(VERSION_KEY),
    buildTime: localStorage.getItem(BUILD_TIME_KEY),
  }
}

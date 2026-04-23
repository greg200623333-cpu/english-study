import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'


function getAppKey(): string {
  const key = process.env.YOUDAO_APP_KEY
  if (!key) throw new Error('YOUDAO_APP_KEY is not configured')
  return key
}

function getAppSecret(): string {
  const secret = process.env.YOUDAO_APP_SECRET
  if (!secret) throw new Error('YOUDAO_APP_SECRET is not configured')
  return secret
}

const TIMEOUT_MS = 8000

function md5(str: string) {
  return createHash('md5').update(str, 'utf8').digest('hex')
}

export async function GET(request: NextRequest) {
  const APP_KEY = getAppKey()
  const APP_SECRET = getAppSecret()

  const word = request.nextUrl.searchParams.get('word')?.trim()
  if (!word || word.length > 100) {
    return NextResponse.json({ error: 'invalid word' }, { status: 400 })
  }

  const salt = Date.now().toString()
  const sign = md5(APP_KEY + word + salt + APP_SECRET)

  const params = new URLSearchParams({
    q: word,
    langType: 'en',
    appKey: APP_KEY,
    salt,
    sign,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`https://openapi.youdao.com/ttsapi?${params.toString()}`, {
      signal: controller.signal,
    })
    clearTimeout(timer)

    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok || !contentType.includes('audio')) {
      const text = await res.text()
      console.error('[tts] upstream error', res.status, text.slice(0, 200))
      return NextResponse.json({ error: 'tts_upstream_error', status: res.status }, { status: 502 })
    }

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (err) {
    clearTimeout(timer)
    if ((err as Error).name === 'AbortError') {
      return NextResponse.json({ error: 'tts_timeout' }, { status: 504 })
    }
    throw err
  }
}

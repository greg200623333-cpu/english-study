import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const APP_KEY = process.env.YOUDAO_APP_KEY!
const APP_SECRET = process.env.YOUDAO_APP_SECRET!

function md5(str: string) {
  return createHash('md5').update(str, 'utf8').digest('hex')
}

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get('word')
  if (!word) {
    return NextResponse.json({ error: 'missing word' }, { status: 400 })
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

  const res = await fetch(`https://openapi.youdao.com/ttsapi?${params.toString()}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!res.ok || !res.headers.get('content-type')?.includes('audio')) {
    const text = await res.text()
    return NextResponse.json({ error: 'tts failed', detail: text }, { status: 502 })
  }

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

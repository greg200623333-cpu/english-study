import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/apiClient'


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

function truncate(q: string): string {
  const size = q.length
  return size <= 20 ? q : q.substring(0, 10) + size + q.substring(size - 10)
}

function encrypt(str: string): string {
  return createHash('sha256').update(str, 'utf-8').digest('hex')
}

/**
 * 有道短语音识别 API
 * POST /api/youdao/asr
 */
export async function POST(request: NextRequest) {
  try {
    const APP_KEY = getAppKey()
    const APP_SECRET = getAppSecret()

    const body = await request.json()
    const {
      audioBase64,
      langType = 'en',
      rate = 16000,
      channel = 1,
    } = body

    if (!audioBase64) {
      return NextResponse.json({ errorCode: '400', error: 'audioBase64 is required' }, { status: 400 })
    }

    
    if (audioBase64.length < 100) {
      console.error('[asr] Audio data too short:', audioBase64.length)
      return NextResponse.json({ errorCode: '4304', error: 'Audio data too short' }, { status: 400 })
    }

    
    try {
      const decoded = Buffer.from(audioBase64, 'base64')
      if (decoded.length < 100) {
        console.error('[asr] Decoded audio too short:', decoded.length)
        return NextResponse.json({ errorCode: '4304', error: 'Decoded audio too short' }, { status: 400 })
      }
      console.log('[asr] Audio decoded successfully, size:', decoded.length, 'bytes')
    } catch (e) {
      console.error('[asr] Invalid base64:', e)
      return NextResponse.json({ errorCode: '4304', error: 'Invalid base64 encoding' }, { status: 400 })
    }

    const curtime = Math.floor(Date.now() / 1000).toString()
    const salt = Date.now().toString() + Math.random().toString(36).substring(2)
    const signStr = APP_KEY + truncate(audioBase64) + salt + curtime + APP_SECRET
    const sign = encrypt(signStr)

    const params = new URLSearchParams({
      appKey: APP_KEY,
      q: audioBase64,
      salt,
      curtime,
      sign,
      signType: 'v2',
      langType,
      rate: rate.toString(),
      format: 'wav',
      channel: channel.toString(),
      type: '1',
    })

    console.log('[asr] Sending request to Youdao ASR API')
    console.log('[asr] Params:', {
      langType,
      rate,
      channel,
      audioLen: audioBase64.length,
      appKey: APP_KEY.substring(0, 8) + '...'
    })

    const response = await fetchWithTimeout('https://openapi.youdao.com/asrapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      timeout: 15000,
      retries: 1,
      onRetry: (attempt, error) => {
        console.warn(`[ASR] Retry attempt ${attempt}:`, error.message)
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[asr] upstream error', response.status, text.slice(0, 200))
      return NextResponse.json({
        errorCode: 'asr_upstream_error',
        error: `Upstream error: ${response.status}`
      }, { status: 502 })
    }

    const text = await response.text()
    console.log('[asr] Youdao response status:', response.status)
    console.log('[asr] Youdao response:', text)

    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      console.error('[asr] Failed to parse response as JSON')
      return NextResponse.json({ errorCode: '500', error: `Invalid response: ${text.slice(0, 200)}` }, { status: 500 })
    }

    
    if (data.errorCode && String(data.errorCode) !== '0') {
      console.error('[asr] Youdao API error:', data.errorCode, data)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[asr] error:', error)
    const err = error as Error

    if (err.name === 'TimeoutError') {
      return NextResponse.json({
        errorCode: 'asr_timeout',
        error: 'Request timeout'
      }, { status: 504 })
    }

    return NextResponse.json({ errorCode: '500', error: 'API request failed' }, { status: 500 })
  }
}

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

function encrypt(str: string): string {
  return createHash('sha256').update(str, 'utf-8').digest('hex')
}

function calculateSign(
  appKey: string,
  appSecret: string,
  audioLength: number,
  salt: string,
  curtime: string
): string {
  const strSrc = appKey + audioLength + salt + curtime + appSecret
  return encrypt(strSrc)
}

function addAuthParams(appKey: string, appSecret: string, audioLength: number) {
  const salt = Date.now().toString() + Math.random().toString(36).substring(2)
  const curtime = Math.floor(Date.now() / 1000).toString()
  const sign = calculateSign(appKey, appSecret, audioLength, salt, curtime)

  return {
    appKey,
    salt,
    curtime,
    signType: 'v3',
    sign
  }
}

/**
 * 有道口语评测 API
 * 用于对话结束后的综合评分
 */
export async function POST(request: NextRequest) {
  try {
    const APP_KEY = getAppKey()
    const APP_SECRET = getAppSecret()

    const body = await request.json()
    const {
      audio, 
      langType = 'en',
      audioType = 'wav',
      refText 
    } = body

    if (!audio) {
      return NextResponse.json({
        errorCode: '400',
        error: 'Audio is required'
      }, { status: 400 })
    }

    
    const audioLength = audio.length

    const params = {
      ...addAuthParams(APP_KEY, APP_SECRET, audioLength),
      audio,
      langType,
      audioType
    }

    
    if (refText) {
      Object.assign(params, { refText })
    }

    const response = await fetchWithTimeout('https://openapi.youdao.com/oraleval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(params),
      timeout: 12000,
      retries: 1,
      onRetry: (attempt, error) => {
        console.warn(`[OralEval] Retry attempt ${attempt}:`, error.message)
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[OralEval] upstream error', response.status, text.slice(0, 200))
      return NextResponse.json({
        errorCode: 'oraleval_upstream_error',
        error: `Upstream error: ${response.status}`
      }, { status: 502 })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Oral Eval API error:', error)
    const err = error as Error

    if (err.name === 'TimeoutError') {
      return NextResponse.json({
        errorCode: 'oraleval_timeout',
        error: 'Request timeout'
      }, { status: 504 })
    }

    return NextResponse.json({
      errorCode: '500',
      error: 'API request failed'
    }, { status: 500 })
  }
}

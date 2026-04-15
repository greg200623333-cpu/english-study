import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

// 延迟获取环境变量
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

function getInput(input: string): string {
  const inputLen = input.length
  return inputLen <= 20 ? input : input.substring(0, 10) + inputLen + input.substring(inputLen - 10)
}

function encrypt(str: string): string {
  return createHash('sha256').update(str, 'utf-8').digest('hex')
}

function addAuthParams(appKey: string, appSecret: string, q: string) {
  const salt = Date.now().toString() + Math.random().toString(36).substring(2)
  const curtime = Math.floor(Date.now() / 1000).toString()
  const input = getInput(q)
  const signStr = appKey + input + salt + curtime + appSecret
  const sign = encrypt(signStr)

  if (process.env.NODE_ENV === 'development') {
    console.log('[aichat] sign params:', { q, input, appKey: appKey.slice(0, 8) + '...', curtime, signStr: signStr.slice(0, 50) + '...' })
  }

  return { appKey, salt, curtime, signType: 'v3', sign }
}

/**
 * 有道 AI 口语对话 - generate_dialog
 * history 由调用方构建好后直接传入，路由只负责签名和转发
 * body: { taskId, scene, userLevel?, history }
 */
export async function POST(request: NextRequest) {
  try {
    const APP_KEY = getAppKey()
    const APP_SECRET = getAppSecret()

    const body = await request.json()
    const { taskId, scene, userLevel = '0', history = [] } = body

    if (!taskId) {
      return NextResponse.json({ code: '400', error: 'taskId is required' }, { status: 400 })
    }

    const params = {
      ...addAuthParams(APP_KEY, APP_SECRET, taskId),
      taskId,
      scene,
      userLevel,
      history,
    }

    if (process.env.NODE_ENV === 'development') {
      const debugHistory = history.map((h: Record<string, unknown>) => ({
        ...h,
        voice: h.voice ? `[BASE64 len=${String(h.voice).length}]` : undefined,
      }))
      console.log('[aichat] history:', JSON.stringify(debugHistory))
    }

    const response = await fetch('https://openapi.youdao.com/ai_dialog/generate_dialog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(params),
    })

    const text = await response.text()
    if (process.env.NODE_ENV === 'development') {
      console.log('[aichat] Youdao response:', text)
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ code: '500', error: `Invalid response: ${text.slice(0, 200)}` }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[aichat] error:', error)
    return NextResponse.json({ code: '500', error: 'API request failed' }, { status: 500 })
  }
}

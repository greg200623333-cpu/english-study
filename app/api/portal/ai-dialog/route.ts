import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/apiClient'

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

// 延迟获取环境变量，避免构建时访问
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

function getInput(input: string | null): string | null {
  if (!input) return input
  const inputLen = input.length
  return inputLen <= 20 ? input : input.substring(0, 10) + inputLen + input.substring(inputLen - 10)
}

function encrypt(str: string): string {
  return createHash('sha256').update(str, 'utf-8').digest('hex')
}

function calculateSign(appKey: string, appSecret: string, q: string, salt: string, curtime: string): string {
  const strSrc = appKey + getInput(q) + salt + curtime + appSecret
  return encrypt(strSrc)
}

function addAuthParams(appKey: string, appSecret: string, q: string) {
  const salt = Date.now().toString() + Math.random().toString(36).substring(2)
  const curtime = Math.floor(Date.now() / 1000).toString()
  const sign = calculateSign(appKey, appSecret, q, salt, curtime)

  return {
    appKey,
    salt,
    curtime,
    signType: 'v3',
    sign
  }
}

// 获取默认场景列表
export async function GET() {
  try {
    const APP_KEY = getAppKey()
    const APP_SECRET = getAppSecret()
    const q = 'topics'
    const params = addAuthParams(APP_KEY, APP_SECRET, q)

    const response = await fetchWithTimeout('https://openapi.youdao.com/ai_dialog/get_default_topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify({ ...params, q }),
      timeout: 10000,
      retries: 1
    })

    if (!response.ok) {
      console.error('[AI Dialog GET] upstream error', response.status)
      return NextResponse.json({ error: 'Failed to get topics' }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Get default topic error:', error)
    const err = error as Error

    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 })
    }

    return NextResponse.json({ error: 'Failed to get topics' }, { status: 500 })
  }
}

// AI 对话相关操作
export async function POST(request: NextRequest) {
  try {
    const APP_KEY = getAppKey()
    const APP_SECRET = getAppSecret()
    const body = await request.json()
    const { action, ...requestData } = body

    let url = ''
    let params: any = {}

    switch (action) {
      case 'generate_topic':
        // 生成场景
        url = 'https://openapi.youdao.com/ai_dialog/generate_topic'
        params = {
          ...addAuthParams(APP_KEY, APP_SECRET, requestData.topic),
          topic: requestData.topic
        }
        break

      case 'generate_dialog':
        // 生成对话
        url = 'https://openapi.youdao.com/ai_dialog/generate_dialog'
        params = {
          ...addAuthParams(APP_KEY, APP_SECRET, requestData.taskId),
          taskId: requestData.taskId,
          userLevel: requestData.userLevel || '0',
          scene: requestData.scene,
          history: requestData.history || []
        }
        break

      case 'generate_recommendation':
        // 生成推荐
        url = 'https://openapi.youdao.com/ai_dialog/generate_recommendation'
        params = {
          ...addAuthParams(APP_KEY, APP_SECRET, requestData.taskId),
          taskId: requestData.taskId,
          userLevel: requestData.userLevel || '0',
          scene: requestData.scene,
          history: requestData.history || [],
          indexArr: requestData.indexArr || ['1'],
          count: requestData.count || '1'
        }
        break

      case 'generate_report':
        // 生成报告
        url = 'https://openapi.youdao.com/ai_dialog/generate_report'
        params = {
          ...addAuthParams(APP_KEY, APP_SECRET, requestData.taskId),
          taskId: requestData.taskId,
          userLevel: requestData.userLevel || '0',
          scene: requestData.scene,
          history: requestData.history || []
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(params),
      timeout: 12000,
      retries: 1,
      onRetry: (attempt, error) => {
        console.warn(`[AI Dialog ${action}] Retry attempt ${attempt}:`, error.message)
      }
    })

    if (!response.ok) {
      console.error(`[AI Dialog ${action}] upstream error`, response.status)
      return NextResponse.json({ error: 'API request failed' }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('AI Dialog API error:', error)
    const err = error as Error

    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 })
    }

    return NextResponse.json({ error: 'API request failed' }, { status: 500 })
  }
}

import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const APP_KEY = process.env.YOUDAO_APP_KEY!
const APP_SECRET = process.env.YOUDAO_APP_SECRET!

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
    const q = 'topics'
    const params = addAuthParams(APP_KEY, APP_SECRET, q)

    const response = await fetch('http://openapi.youdao.com/ai_dialog/get_default_topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify({ ...params, q })
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Get default topic error:', error)
    return NextResponse.json({ error: 'Failed to get topics' }, { status: 500 })
  }
}

// AI 对话相关操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...requestData } = body

    let url = ''
    let params: any = {}

    switch (action) {
      case 'generate_topic':
        // 生成场景
        url = 'http://openapi.youdao.com/ai_dialog/generate_topic'
        params = {
          ...addAuthParams(APP_KEY, APP_SECRET, requestData.topic),
          topic: requestData.topic
        }
        break

      case 'generate_dialog':
        // 生成对话
        url = 'http://openapi.youdao.com/ai_dialog/generate_dialog'
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
        url = 'http://openapi.youdao.com/ai_dialog/generate_recommendation'
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
        url = 'http://openapi.youdao.com/ai_dialog/generate_report'
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

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(params)
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('AI Dialog API error:', error)
    return NextResponse.json({ error: 'API request failed' }, { status: 500 })
  }
}

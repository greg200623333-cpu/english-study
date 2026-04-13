import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const APP_KEY = process.env.YOUDAO_APP_KEY!
const APP_SECRET = process.env.YOUDAO_APP_SECRET!

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
    const body = await request.json()
    const {
      audio, // Base64 音频
      langType = 'en',
      audioType = 'wav',
      refText // 参考文本（可选）
    } = body

    if (!audio) {
      return NextResponse.json({
        errorCode: '400',
        error: 'Audio is required'
      }, { status: 400 })
    }

    // 计算音频长度用于签名
    const audioLength = audio.length

    const params = {
      ...addAuthParams(APP_KEY, APP_SECRET, audioLength),
      audio,
      langType,
      audioType
    }

    // 如果提供了参考文本，添加到参数中
    if (refText) {
      Object.assign(params, { refText })
    }

    const response = await fetch('https://openapi.youdao.com/oraleval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(params)
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Oral Eval API error:', error)
    return NextResponse.json({
      errorCode: '500',
      error: 'API request failed'
    }, { status: 500 })
  }
}

import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
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

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const APP_KEY = getAppKey()
    const APP_SECRET = getAppSecret()

    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: '图片数据不能为空' }, { status: 400 })
    }

    // 验证 base64 大小（不超过 4MB）
    const sizeInMB = (image.length * 3) / 4 / 1024 / 1024
    if (sizeInMB > 4) {
      return NextResponse.json({ error: '图片过大，请压缩后重试' }, { status: 400 })
    }

    const curtime = Math.floor(Date.now() / 1000).toString()
    const salt = Date.now().toString() + Math.random().toString(36).substring(2)
    const signStr = APP_KEY + truncate(image) + salt + curtime + APP_SECRET
    const sign = encrypt(signStr)

    const params = new URLSearchParams({
      appKey: APP_KEY,
      q: image,
      salt,
      curtime,
      sign,
      signType: 'v3',
      grade: 'high', // 高中级别
      correctVersion: 'advanced', // 高级批改
      isNeedEssayReport: 'true' // 需要写作报告
    })

    console.log('[check-image] Sending request to Youdao Writing Correction API')

    const response = await fetchWithTimeout('https://openapi.youdao.com/v2/correct_writing_image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      timeout: 10000,
      retries: 1,
      onRetry: (attempt, error) => {
        console.warn(`[check-image] Retry attempt ${attempt}:`, error.message)
      }
    })

    if (!response.ok) {
      console.error('[check-image] upstream error', response.status)
      return NextResponse.json({ error: '图像批改服务异常' }, { status: 502 })
    }

    const text = await response.text()
    console.log('[check-image] Youdao response status:', response.status)

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      console.error('[check-image] Failed to parse response as JSON')
      return NextResponse.json({ error: '服务响应格式错误' }, { status: 500 })
    }

    // 检查错误码
    if (data.errorCode && String(data.errorCode) !== '0') {
      console.error('[check-image] Youdao API error:', data.errorCode, data)

      const errorMessages: Record<string, string> = {
        '101': '缺少必填参数',
        '108': '应用ID无效',
        '202': '签名验证失败',
        '401': '账户已欠费',
        '411': '访问频率受限',
        '29005': '图片文件为空',
        '29006': '图片过大',
        '29007': '作文批改的文本内容为空',
        '29009': 'OCR识别结果为空'
      }

      const errorMsg = errorMessages[String(data.errorCode)] || `未知错误 (${data.errorCode})`
      return NextResponse.json({ error: `批改失败: ${errorMsg}` }, { status: 400 })
    }

    // 解析有道返回的结果
    const result = data.Result || {}
    const essayFeedback = result.essayFeedback || {}
    const sentsFeedback = essayFeedback.sentsFeedback || []
    const majorScore = result.majorScore || {}

    // 提取语法错误
    const grammarErrors: Array<{
      type: string
      original: string
      corrected: string
      position: number
      explanation: string
    }> = []

    sentsFeedback.forEach((sent: any) => {
      const errorPosInfos = sent.errorPosInfos || []
      errorPosInfos.forEach((error: any) => {
        grammarErrors.push({
          type: error.errorTypeTitle || '语法错误',
          original: error.orgChunk || '',
          corrected: error.correctChunk || '',
          position: sent.sentStartPos + (error.startPos || 0),
          explanation: error.errBaseInfo || error.detailReason || ''
        })
      })
    })

    // 构建改进版本
    const improvedVersion = sentsFeedback
      .map((sent: any) => sent.correctedSent || sent.rawSent)
      .join(' ')

    // 构建战略建议
    const strategicAdvice = `【战术评估卷宗】

总体评价：${result.essayAdvice || '作文已完成批改'}

语法分析：${majorScore.grammarAdvice || '语法表现良好'}
词汇分析：${majorScore.wordAdvice || '词汇使用恰当'}
结构分析：${majorScore.structureAdvice || '结构合理'}

检测到 ${grammarErrors.length} 处需要改进的地方。

${result.essayReport?.grammarErrorAdvice?.advice || '建议继续保持练习。'}`

    // 计算综合得分
    const totalScore = result.totalScore || majorScore.grammarScore || 0

    return NextResponse.json({
      score: Math.round(totalScore),
      grammarErrors,
      improvedVersion: improvedVersion || result.rawEssay || '',
      strategicAdvice,
      dimensions: {
        grammar: Math.round(majorScore.grammarScore || 0),
        vocabulary: Math.round(majorScore.wordScore || 0),
        structure: Math.round(majorScore.structureScore || 0),
        content: Math.round(majorScore.topicScore || 0)
      },
      rawYoudaoResult: result // 保留原始结果供调试
    })
  } catch (error) {
    console.error('[check-image] Error:', error)
    const err = error as Error

    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: '图像批改超时，请稍后重试' }, { status: 504 })
    }

    return NextResponse.json({ error: '图像扫描失败，请稍后重试' }, { status: 500 })
  }
}

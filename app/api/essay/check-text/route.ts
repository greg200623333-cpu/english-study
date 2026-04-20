import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { text } = await req.json()

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: '文本内容至少需要 50 个字符' }, { status: 400 })
    }

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    if (wordCount < 50) {
      return NextResponse.json({ error: '文本内容至少需要 50 个单词' }, { status: 400 })
    }

    const prompt = `你是 SSA WarRoom 战略英语系统的作文批改引擎。请对以下英文作文进行深度战术分析。

作文内容：
${text}

请严格按照以下 JSON 格式返回，不要输出任何其他内容：
{
  "score": <0-100的整数评分>,
  "grammarErrors": [
    {
      "type": "错误类型（如：时态错误、主谓不一致、拼写错误等）",
      "original": "原始错误文本",
      "corrected": "修正后的文本",
      "position": <错误在原文中的大致位置（字符索引）>,
      "explanation": "详细解释为什么这是错误以及如何修正"
    }
  ],
  "improvedVersion": "完整的改进版本作文",
  "strategicAdvice": "战略性建议，包括：\n1. 整体评价\n2. 语法与用词分析\n3. 结构与逻辑\n4. 亮点与优势\n5. 改进方向",
  "dimensions": {
    "grammar": <语法得分 0-100>,
    "vocabulary": <词汇得分 0-100>,
    "structure": <结构得分 0-100>,
    "content": <内容得分 0-100>
  }
}`

    const response = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content ?? '{}')

    // 验证和规范化数据
    const score = Math.min(100, Math.max(0, Number(result.score) || 60))
    const grammarErrors = Array.isArray(result.grammarErrors) ? result.grammarErrors : []
    const improvedVersion = result.improvedVersion || text
    const strategicAdvice = result.strategicAdvice || '批改完成'
    const dimensions = result.dimensions || {
      grammar: score,
      vocabulary: score,
      structure: score,
      content: score
    }

    return NextResponse.json({
      score,
      grammarErrors,
      improvedVersion,
      strategicAdvice,
      dimensions
    })
  } catch (err: unknown) {
    console.error('[check-text] Error:', err)
    return NextResponse.json({ error: '情报分析失败，请稍后重试' }, { status: 500 })
  }
}

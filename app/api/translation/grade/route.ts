import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * AI辅助生成：DeepSeek-Coder，2026-04-11
 * 用途：Next.js App Router后端路由接入大模型API，用于翻译评分与解析
 * 采纳率：约85%
 */

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

// 延迟初始化客户端
function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  return new Anthropic({ apiKey })
}

export async function POST(req: NextRequest) {
  try {
    const anthropic = getClient()
    const { chinese, translation, category } = await req.json()

    if (!chinese || !translation) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const prompt = `你是一位专业的英语翻译批改老师。请对以下学生的翻译进行批改。

【中文原文】
${chinese}

【学生翻译】
${translation}

请按以下格式输出：

1. 评分（0-100分）：给出一个客观的分数
2. 优点：列出翻译中做得好的地方（如果有）
3. 问题：指出翻译中的错误和不足（语法、用词、表达等）
4. 改进建议：给出具体的修改建议
5. 参考译文：提供一个标准的英文翻译

请用简洁、专业的语言进行点评，帮助学生提高翻译水平。`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const result = content.text

    // 解析AI返回的结果
    const scoreMatch = result.match(/评分[：:]\s*(\d+)/i)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0

    // 提取参考译文
    const referenceMatch = result.match(/参考译文[：:]\s*(.+?)(?=\n\n|$)/i)
    const reference = referenceMatch ? referenceMatch[1].trim() : ''

    return NextResponse.json({
      score,
      feedback: result,
      reference,
    })
  } catch (error) {
    console.error('Translation grading error:', error)
    return NextResponse.json(
      { error: 'AI批改失败，请稍后重试' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * AI辅助生成：DeepSeek-Coder，2026-04-11
 * 用途：Next.js App Router后端路由接入大模型API，用于战术指令场景对话生成
 * 采纳率：约85%
 */

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

// 延迟初始化客户端
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
  try {
    const client = getClient()
    const { messages, userMessage, systemPrompt } = await req.json()

    if (!userMessage || !systemPrompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: userMessage },
    ]

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const message = completion.choices[0]?.message?.content || 'No response generated.'

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Scenario chat error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}

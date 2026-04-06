import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

export async function POST(req: NextRequest) {
  try {
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

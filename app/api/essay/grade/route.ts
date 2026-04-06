import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
  })
}

const categoryPrompt: Record<string, string> = {
  cet4: '大学英语四级（CET-4）',
  cet6: '大学英语六级（CET-6）',
  kaoyan: '考研英语',
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, category } = await req.json()

    if (!content || content.trim().length < 50) {
      return NextResponse.json({ error: '作文内容太短' }, { status: 400 })
    }

    const prompt = `你是一位专业的英语作文评分老师，请对以下${categoryPrompt[category] ?? '英语'}作文进行批改。

作文标题：${title || '无标题'}
作文内容：
${content}

请严格按照以下 JSON 格式返回，不要输出任何其他内容：
{
  "score": <0-100的整数评分>,
  "feedback": "<详细的中文批改意见，包括：\n1. 总体评价\n2. 内容与结构\n3. 语言与语法\n4. 亮点\n5. 改进建议>"
}`

    const response = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content ?? '{}')
    const score = Math.min(100, Math.max(0, Number(result.score) || 60))
    const feedback = result.feedback ?? '批改完成'

    return NextResponse.json({ score, feedback })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ error: '批改服务异常，请稍后重试' }, { status: 500 })
  }
}

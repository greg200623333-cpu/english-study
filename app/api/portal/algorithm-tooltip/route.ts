import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'


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

const SYSTEM_PROMPT = `你是一个计算机专业英语阅读助手。用户会给你一个算法术语或短语，请你返回严格 JSON：
{
  "explanation": "中文释义，结合算法题语境解释",
  "codeDemo": "一段 6-16 行的 C 语言 demo，展示该术语或概念如何在代码中出现"
}
不要输出 markdown，不要输出额外说明。`

export async function POST(req: NextRequest) {
  try {
    const client = getClient()

    const { term, problemTitle, context } = await req.json()

    if (!term || typeof term !== 'string') {
      return NextResponse.json({ error: 'Missing term' }, { status: 400 })
    }

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `problem=${problemTitle ?? 'Algorithm Reading'}\nterm=${term}\ncontext=${context ?? ''}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const parsed = JSON.parse(jsonText)

    return NextResponse.json({
      explanation: parsed.explanation ?? '该术语需要结合算法题上下文理解。',
      codeDemo: parsed.codeDemo ?? 'int main(void) {\n  return 0;\n}',
    })
  } catch (error) {
    console.error('Algorithm tooltip error:', error)
    return NextResponse.json(
      {
        explanation: '该术语通常对应算法题中的核心推理节点，建议结合题意、边界条件和数据结构操作一起理解。',
        codeDemo: 'int main(void) {\n  int answer = 0;\n  return answer;\n}',
      },
      { status: 200 }
    )
  }
}

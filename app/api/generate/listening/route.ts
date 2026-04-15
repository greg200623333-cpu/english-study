import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSession } from '@/lib/session'

// 防止构建时预渲染
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
    const { category, type, count = 3 } = await req.json()
    const safeCount = Math.max(1, Math.min(10, Number(count) || 3))

    const typeDesc: Record<string, string> = {
      listening_news: '新闻广播（语速较快，约150词，涉及时事、科技、社会话题）',
      listening_interview: '人物访谈对话（约200词，两人对话形式，涉及职业、生活、观点）',
      listening_passage: '短文独白（约180词，叙述性或说明性文体）',
    }

    const catDesc = category === 'cet4' ? '四级' : '六级'
    const desc = typeDesc[type] ?? '英语听力材料'

    const prompt = `你是一位专业的大学英语${catDesc}听力出题专家。请生成 ${safeCount} 段${desc}听力材料，每段材料附带3道选择题。

严格按以下JSON格式返回，不输出其他内容：
{
  "passages": [
    {
      "text": "完整的英文听力原文（约150-200词）",
      "title": "材料标题（中文）",
      "questions": [
        {
          "content": "题目问题（英文）",
          "options": ["A. 选项", "B. 选项", "C. 选项", "D. 选项"],
          "answer": "A",
          "explanation": "解析（中文）"
        }
      ]
    }
  ]
}`

    const response = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const result = JSON.parse(response.choices[0].message.content ?? '{}')
    return NextResponse.json({ passages: result.passages ?? [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 })
  }
}

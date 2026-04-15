import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
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

const categoryLabel: Record<string, string> = {
  cet4: '大学英语四级（CET-4）',
  cet6: '大学英语六级（CET-6）',
  kaoyan: '考研英语',
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { category, count = 10 } = await req.json()
    const safeCount = Math.max(1, Math.min(50, Number(count) || 10))

    if (!categoryLabel[category]) {
      return NextResponse.json({ error: '无效的单词类别' }, { status: 400 })
    }

    const prompt = `你是一位专业的英语词汇教师。请生成 ${safeCount} 个${categoryLabel[category]}核心词汇。

严格按照以下 JSON 格式返回，不要输出任何其他内容：
{
  "words": [
    {
      "word": "英文单词",
      "phonetic": "/音标/",
      "meaning": "词性. 中文释义（如：v. 放弃；抛弃）",
      "example": "一个包含该单词的英文例句。"
    }
  ]
}`

    const response = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const result = JSON.parse(response.choices[0].message.content ?? '{}')
    const words = result.words ?? []

    if (words.length === 0) {
      return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 })
    }

    const supabase = await createClient()
    const rows = words.map((w: { word: string; phonetic: string; meaning: string; example: string }) => ({
      category,
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example: w.example,
    }))

    const { data, error } = await supabase.from('words').insert(rows).select('id')
    if (error) throw error

    return NextResponse.json({ count: data.length, message: `成功生成 ${data.length} 个单词` })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ error: '生成单词失败，请稍后重试' }, { status: 500 })
  }
}

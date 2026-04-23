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

const VALID_CATEGORIES = ['cet4', 'cet6', 'kaoyan', 'kaoyan1', 'kaoyan2']
const VALID_TYPES = [
  'writing', 'listening_news', 'listening_interview', 'listening_passage',
  'reading_match', 'reading_choice', 'reading_cloze', 'translation', 'cloze',
  'reading', 'new_type_match', 'new_type_summary', 'writing_small', 'writing_big'
]

function sanitize(str: string, maxLen: number): string {
  return String(str ?? '').replace(/[<>]/g, '').slice(0, maxLen)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const passage = sanitize(body.passage ?? '', 2000)
    const content = sanitize(body.content ?? '', 1000)
    const answer = sanitize(body.answer ?? '', 10)
    const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'cet4'
    const type = VALID_TYPES.includes(body.type) ? body.type : 'reading'
    const options = Array.isArray(body.options)
      ? body.options.slice(0, 6).map((o: unknown) => sanitize(String(o), 200))
      : []

    const prompt = `你是一位专业的英语考试解题专家，请对以下题目进行深度解析。

题目类型：${type}（${category}）
${passage ? `\n原文：\n${passage}\n` : ''}
题干：${content}
${options.length ? `选项：\n${options.join('\n')}` : ''}
正确答案：${answer}

请从以下维度给出详细解析（用中文回答）：
1. **解题思路**：如何快速定位答案，排除干扰项
2. **知识点**：涉及的语法/词汇/逻辑知识点
3. **陷阱分析**：命题人设置的干扰项分析
4. **举一反三**：相关知识点延伸或同类题型技巧
${type === 'reading' || type === 'reading_choice' ? '5. **长难句拆解**：文章中关键长难句的结构分析' : ''}
${type === 'cloze' ? '5. **熟词僻义**：如有熟词僻义请重点说明' : ''}

请用清晰的结构输出，重点突出，帮助考生真正理解并掌握解题方法。`

    const response = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    const analysis = response.choices[0].message.content ?? '解析生成失败'
    return NextResponse.json({ analysis })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ error: 'AI 解题失败，请稍后重试' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
  })
}

export async function POST(req: NextRequest) {
  try {
    const { passage, content, options, answer, category, type } = await req.json()

    const prompt = `你是一位专业的英语考试解题专家，请对以下题目进行深度解析。

题目类型：${type}（${category}）
${passage ? `\n原文：\n${passage}\n` : ''}
题干：${content}
${options?.length ? `选项：\n${options.join('\n')}` : ''}
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

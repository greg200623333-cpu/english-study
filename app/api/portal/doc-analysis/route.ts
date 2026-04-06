import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const SYSTEM_PROMPT = `你是一位专业的英语技术文档分析助手。用户会给你一段英文技术文档或代码注释。请你分析后，返回一个 JSON 对象，包含以下四个部分：

1. "keywords" — 高频技术关键词数组（最多 10 个），每个对象包含:
   - "term": 英文关键词
   - "frequency": 文中出现频次（估计值）
   - "explanation": 中文释义与在技术语境中的用法说明

2. "techTerms" — 专业术语数组（最多 8 个），每个对象包含:
   - "term": 英文术语
   - "category": 术语分类（如 "数据结构"、"操作系统"、"网络"、"编译原理" 等）
   - "definition": 该术语的中英文解释

3. "complexSentences" — 长难句数组（最多 5 句），每个对象包含:
   - "sentence": 原始英文句子
   - "breakdown": 句子结构拆解（主语、谓语、从句等）用中文说明
   - "translation": 中文翻译

4. "learningPath" — 个性化学习路径数组（3-5 个阶段），每个对象包含:
   - "stage": 阶段序号
   - "title": 阶段名称（中文）
   - "tasks": 该阶段的具体学习任务列表（中文，3-5 项）
   - "focus": 核心能力目标（中文，一句话）

5. "summary" — 文档内容概要（中文，2-3 句话）

请严格返回合法 JSON，不要包含 markdown 代码块标记或额外文字。`

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '缺少文档内容' }, { status: 400 })
    }

    if (text.length > 15000) {
      return NextResponse.json({ error: '文档过长，请限制在 15000 字符以内' }, { status: 400 })
    }

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 3000,
      temperature: 0.3,
    })

    const raw = completion.choices[0]?.message?.content || ''

    // Strip markdown code block if present
    const jsonStr = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    const parsed = JSON.parse(jsonStr)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Doc analysis error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI 返回格式异常，请重试' }, { status: 500 })
    }
    return NextResponse.json({ error: '文档分析失败，请稍后重试' }, { status: 500 })
  }
}

import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

type WordPayload = {
  word: string
  meaning: string | null
  status: 'known' | 'learning' | 'new'
}

export async function POST(req: Request) {
  try {
    const { exam, tier, bucketLabel, words } = (await req.json()) as {
      exam?: string
      tier?: 'core' | 'full'
      bucketLabel?: string
      words?: WordPayload[]
    }

    if (!exam || !tier || !bucketLabel || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const known = words.filter((word) => word.status === 'known').slice(0, 60)
    const unmastered = words.filter((word) => word.status !== 'known').slice(0, 60)
    const safeWords = words.slice(0, 120)

    const context = safeWords
      .map((word, index) => `${index + 1}. ${word.word} | ${word.meaning ?? 'N/A'} | ${word.status}`)
      .join('\n')

    const prompt = `
你是“词汇财政分析师”，请基于以下资产分类给出中文分析。

[战区]
- 战略: ${exam}
- 词书层级: ${tier === 'core' ? '核心词汇' : '总词汇'}
- 资产分类: ${bucketLabel}
- 总词量: ${safeWords.length}
- 已掌握: ${known.length}
- 未掌握(含learning/new): ${unmastered.length}

[词汇清单]
${context}

请输出：
1) 该分类词汇特征（词根、语义场、难点）
2) 常考语境（阅读/写作/翻译各给重点）
3) 投资建议（按“立即回补 / 本周配置 / 考前冲刺”三层给复习策略）
4) 风险提示（若不处理会导致什么分数层面损失）

要求：语气像财政分析简报，内容可执行，避免空话。
`.trim()

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    })

    const analysis = completion.choices[0]?.message?.content?.trim() ?? '分析生成失败'
    return NextResponse.json({ analysis })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

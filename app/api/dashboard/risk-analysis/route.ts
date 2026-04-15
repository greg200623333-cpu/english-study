import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

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

const VALID_EXAMS = ['CET-4 基础建设', 'CET-6 全面扩张', '考研英语 核心攻坚', 'cet4', 'cet6', 'kaoyan']

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const client = getClient()

    const body = await req.json()

    const exam = VALID_EXAMS.includes(body.exam) ? String(body.exam) : 'CET-4'
    const totalQuiz = Math.max(0, Math.min(99999, Number(body.totalQuiz) || 0))
    const accuracy = Math.max(0, Math.min(100, Number(body.accuracy) || 0))
    const daysToExam = Math.max(0, Math.min(3650, Number(body.daysToExam) || 0))
    const avgScore = Math.max(0, Math.min(100, Number(body.avgScore) || 0))
    const reviewDeficit = Math.max(0, Math.min(99999, Number(body.reviewDeficit) || 0))

    const wordStats = {
      known: Math.max(0, Number(body.wordStats?.known) || 0),
      learning: Math.max(0, Number(body.wordStats?.learning) || 0),
      new: Math.max(0, Number(body.wordStats?.new) || 0),
    }
    const skillBalance = {
      listening: Math.max(0, Math.min(100, Number(body.skillBalance?.listening) || 0)),
      speaking: Math.max(0, Math.min(100, Number(body.skillBalance?.speaking) || 0)),
      reading: Math.max(0, Math.min(100, Number(body.skillBalance?.reading) || 0)),
      writing: Math.max(0, Math.min(100, Number(body.skillBalance?.writing) || 0)),
    }

    const laws = body.laws && typeof body.laws === 'object' ? body.laws as Record<string, boolean> : {}
    const activeLaws = Object.entries(laws)
      .filter(([, active]) => active === true)
      .map(([key]) => key)
      .join(', ') || '无'

    const prompt = `
你是"国家战略风险分析官"，请基于以下备考数据，给出一份中文战略风险评估简报。

[基本战情]
- 战略方向: ${exam}
- 距考试: ${daysToExam} 天
- 词汇 GDP：已掌握 ${wordStats.known} 词，推进中 ${wordStats.learning} 词，未学 ${wordStats.new} 词
- 当前财政赤字: ${reviewDeficit} pts
- 题目总量: ${totalQuiz} 题，正确率: ${accuracy}%
- 作文均分: ${avgScore}
- 生效法案: ${activeLaws}

[能力配比]
- 听力: ${skillBalance.listening}
- 口语: ${skillBalance.speaking}
- 阅读: ${skillBalance.reading}
- 写作: ${skillBalance.writing}

请输出：
1) **整体战略风险等级**（低 / 中 / 高 / 极高）并给出判断依据
2) **最薄弱战线**（最需要立即补强的 1-2 个方向及原因）
3) **关键指标预警**（哪些数据最危险，忽视后果）
4) **紧急行动建议**（接下来 7 天内最优先要做的 3 件事）

要求：语气简练有力，像军事参谋简报，不超过 400 字，每部分加粗标题。
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

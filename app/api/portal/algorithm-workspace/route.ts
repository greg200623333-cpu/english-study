import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * AI辅助生成：DeepSeek-Coder，2026-04-11
 * 用途：Next.js App Router后端路由接入大模型API，用于算法工作区战术指令生成
 * 采纳率：约85%
 */

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

const languageInstructions: Record<string, string> = {
  c: 'C 语言',
  python: 'Python 语言',
  javascript: 'JavaScript 语言',
  java: 'Java 语言',
  cpp: 'C++ 语言',
  go: 'Go 语言',
  rust: 'Rust 语言',
}

function getSystemPrompt(language: string): string {
  const langName = languageInstructions[language] || 'Python 语言'
  return `你是一个算法英语沉浸阅读引擎。用户会给你一整段英文算法题目，请你返回严格 JSON：
{
  "title": "提炼后的英文题目标题",
  "summary": "中文战术摘要，说明题意、关键约束、核心解法方向",
  "highlightedTerms": ["需要在题干中高亮的英文术语或短语", "..."],
  "codeSolution": "完整可读的 ${langName} 参考实现，带少量关键注释",
  "quizzes": [
    {"id": "q1", "prompt": "纯英文填空题，用 _____ 表示空格", "answer": "单词或短语答案", "hint": "英文提示", "cnConcept": "简短中文概念标签（4-8字）", "cnHint": "中文解释，说明这道题考察的核心算法知识点（30-60字）"},
    {"id": "q2", "prompt": "纯英文填空题，用 _____ 表示空格", "answer": "单词或短语答案", "hint": "英文提示", "cnConcept": "简短中文概念标签", "cnHint": "中文解释"},
    {"id": "q3", "prompt": "纯英文填空题，用 _____ 表示空格", "answer": "单词或短语答案", "hint": "英文提示", "cnConcept": "简短中文概念标签", "cnHint": "中文解释"}
  ]
}
要求：
1. highlightedTerms 返回 4-8 个术语。
2. quizzes 返回 3 题，答案尽量是单词或简短术语，便于终端输入校验。
3. codeSolution 必须是 ${langName}，不要 markdown 代码块标记。
4. cnConcept 是该题考点的简短中文标签，例如"二分查找"、"时间复杂度 O(log n)"、"子序列 vs 子数组"。
5. cnHint 是中文解释，帮助学生理解英文填空题背后的算法原理。
6. 只返回 JSON，不要额外解释。`
}

const fallback = {
  title: 'Analysis of Algorithm Problems',
  summary:
    '题目要求在严格递增子序列语境下满足 O(n log n) 复杂度，重点理解 subsequence 与 subarray 的区别、binary search 的替换策略，以及 tails array 如何维护每个长度的最优结尾。',
  highlightedTerms: ['strictly increasing subsequence', 'O(n log n)', 'binary search', 'tails array'],
  codeSolution:
    '#include <stdio.h>\n\nint lower_bound(int *arr, int size, int target) {\n  int left = 0;\n  int right = size;\n\n  while (left < right) {\n    int mid = left + (right - left) / 2;\n    if (arr[mid] < target) {\n      left = mid + 1;\n    } else {\n      right = mid;\n    }\n  }\n\n  return left;\n}\n\nint lengthOfLIS(int *nums, int numsSize) {\n  int tails[2500];\n  int size = 0;\n\n  for (int i = 0; i < numsSize; i++) {\n    int pos = lower_bound(tails, size, nums[i]);\n    tails[pos] = nums[i];\n    if (pos == size) {\n      size++;\n    }\n  }\n\n  return size;\n}\n',
  quizzes: [
    {
      id: 'q1',
      prompt: 'Use _____ search to update the replacement position in O(log n).',
      answer: 'binary',
      hint: 'It halves the search space every round.',
      cnConcept: '二分查找 · O(log n)',
      cnHint: '在 tails 数组中定位插入位置时，使用二分查找可将每次操作从 O(n) 降至 O(log n)，整体复杂度达到 O(n log n)。',
    },
    {
      id: 'q2',
      prompt: 'The algorithm maintains a _____ array to store the smallest tail of each valid length.',
      answer: 'tails',
      hint: 'It stores the optimal ending element for each subsequence length.',
      cnConcept: 'tails 数组维护',
      cnHint: 'tails[i] 保存当前长度为 i+1 的递增子序列末尾的最小值。贪心策略使得 tails 始终有序，从而支持二分查找。',
    },
    {
      id: 'q3',
      prompt: 'A valid answer is an increasing _____, where elements need not be adjacent.',
      answer: 'subsequence',
      hint: 'Relative order matters, but adjacency does not.',
      cnConcept: '子序列 vs 子数组',
      cnHint: '子序列（subsequence）保持相对顺序但元素可以不连续；子数组（subarray）要求元素连续。LIS 问题求的是子序列，而非子数组。',
    },
  ],
}

export async function POST(req: NextRequest) {
  try {
    const client = getClient()

    const { problem, language = 'python' } = await req.json()

    if (!problem || typeof problem !== 'string') {
      return NextResponse.json({ error: 'Missing problem' }, { status: 400 })
    }

    const systemPrompt = getSystemPrompt(language)

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.35,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: problem },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const parsed = JSON.parse(jsonText)

    return NextResponse.json({
      title: parsed.title ?? fallback.title,
      summary: parsed.summary ?? fallback.summary,
      highlightedTerms: Array.isArray(parsed.highlightedTerms) && parsed.highlightedTerms.length ? parsed.highlightedTerms : fallback.highlightedTerms,
      codeSolution: parsed.codeSolution ?? fallback.codeSolution,
      quizzes: Array.isArray(parsed.quizzes) && parsed.quizzes.length ? parsed.quizzes : fallback.quizzes,
    })
  } catch (error) {
    console.error('Algorithm workspace generation error:', error)
    return NextResponse.json(fallback, { status: 200 })
  }
}

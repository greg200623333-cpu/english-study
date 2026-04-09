import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const SYSTEM_PROMPT = `你是一个算法英语沉浸阅读引擎。用户会给你一整段英文算法题目，请你返回严格 JSON：
{
  "title": "提炼后的英文题目标题",
  "summary": "中文战术摘要，说明题意、关键约束、核心解法方向",
  "highlightedTerms": ["需要在题干中高亮的英文术语或短语", "..."],
  "codeSolution": "完整可读的 C 语言参考实现，带少量关键注释",
  "quizzes": [
    {"id": "q1", "prompt": "纯英文填空题", "answer": "单词或短语答案", "hint": "英文提示"},
    {"id": "q2", "prompt": "纯英文填空题", "answer": "单词或短语答案", "hint": "英文提示"},
    {"id": "q3", "prompt": "纯英文填空题", "answer": "单词或短语答案", "hint": "英文提示"}
  ]
}
要求：
1. highlightedTerms 返回 4-8 个术语。
2. quizzes 返回 3 题，答案尽量是单词或简短术语，便于终端输入校验。
3. codeSolution 必须是 C 语言，不要 markdown。
4. 只返回 JSON，不要额外解释。`

const fallback = {
  title: 'Longest Increasing Subsequence',
  summary:
    '题目要求在严格递增子序列语境下满足 O(n log n) 复杂度，重点理解 subsequence 与 subarray 的区别、binary search 的替换策略，以及 tails array 如何维护每个长度的最优结尾。',
  highlightedTerms: ['strictly increasing subsequence', 'O(n log n)', 'binary search', 'tails array'],
  codeSolution:
    '#include <stdio.h>\n\nint lower_bound(int *arr, int size, int target) {\n  int left = 0;\n  int right = size;\n\n  while (left < right) {\n    int mid = left + (right - left) / 2;\n    if (arr[mid] < target) {\n      left = mid + 1;\n    } else {\n      right = mid;\n    }\n  }\n\n  return left;\n}\n\nint lengthOfLIS(int *nums, int numsSize) {\n  int tails[2500];\n  int size = 0;\n\n  for (int i = 0; i < numsSize; i++) {\n    int pos = lower_bound(tails, size, nums[i]);\n    tails[pos] = nums[i];\n    if (pos == size) {\n      size++;\n    }\n  }\n\n  return size;\n}\n',
  quizzes: [
    {
      id: 'q1',
      prompt: 'Use _ _ _ _ _ _ search to update the replacement position in O(log n).',
      answer: 'binary',
      hint: 'It halves the search space every round.',
    },
    {
      id: 'q2',
      prompt: 'The algorithm maintains a tails _ _ _ _ _ for each valid length.',
      answer: 'array',
      hint: 'It is contiguous and index-based.',
    },
    {
      id: 'q3',
      prompt: 'A valid answer is an increasing _ _ _ _ _ _ _ _ _ _, not necessarily adjacent.',
      answer: 'subsequence',
      hint: 'Relative order matters, adjacency does not.',
    },
  ],
}

export async function POST(req: NextRequest) {
  try {
    const { problem } = await req.json()

    if (!problem || typeof problem !== 'string') {
      return NextResponse.json({ error: 'Missing problem' }, { status: 400 })
    }

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.35,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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

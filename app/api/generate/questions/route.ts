import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
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

const categoryLabel: Record<string, string> = {
  cet4: '大学英语四级（CET-4）',
  cet6: '大学英语六级（CET-6）',
  kaoyan1: '考研英语一',
  kaoyan2: '考研英语二',
}

const validTypes = [
  'writing', 'listening_news', 'listening_interview', 'listening_passage',
  'reading_match', 'reading_choice', 'reading_cloze', 'translation', 'cloze',
  'reading', 'new_type_match', 'new_type_summary', 'writing_small', 'writing_big'
]

function buildPrompt(category: string, type: string, count: number): string {
  const cat = categoryLabel[category] ?? '英语'
  const typePrompts: Record<string, string> = {
    writing: `生成 ${count} 道${cat}写作题，给出作文题目和写作要求（options填空数组，answer填"见解析"，explanation给出写作思路和要点）`,
    listening_news: `模拟${cat}新闻听力题，生成 ${count} 道选择题。题干描述新闻内容要点，考察关键信息捕捉`,
    listening_interview: `模拟${cat}长对话听力题，生成 ${count} 道选择题。题干描述对话场景和问题`,
    listening_passage: `模拟${cat}听力短文题，生成 ${count} 道选择题。考察主旨大意和细节`,
    reading_match: `生成${cat}段落信息匹配题，提供一篇约600词英文文章（放passage字段），文章分为10个段落，每个段落开头用[A]、[B]、[C]、[D]、[E]、[F]、[G]、[H]、[I]、[J]标注，段落之间用两个换行符分隔。生成 ${count} 道题，每题给出一句话描述某段落的信息，options为["段落 A","段落 B","段落 C","段落 D","段落 E","段落 F","段落 G","段落 H","段落 I","段落 J"]，answer填对应的段落选项如"段落 A"`,
    reading_choice: `生成${cat}仔细阅读题，提供一篇约400词英文文章（放passage字段），生成 ${count} 道选择题，含主旨、细节、推断题，设置同义替换陷阱`,
    reading_cloze: `生成${cat}篇章词汇完形填空。要求：①passage字段包含约150词英文短文，文中标注10个[blank]；②每题options相同，包含15个单词["A. abandon","B. benefit","C. challenge","D. contribute","E. dedicate","F. eliminate","G. establish","H. identify","I. implement","J. maintain","K. promote","L. recognize","M. schedule","N. transform","O. zone"]；③第1题content="第26题"...第10题="第35题"；④answer写字母A-O。生成${count}道题`,
    translation: `生成 ${count} 道${cat}汉译英题，每题给出约100字中文段落（涉及中国文化主题），answer给参考译文，explanation给翻译要点`,
    cloze: `生成${cat}完形填空，提供约250词文章（放passage字段，用[blank_1][blank_2]...标注空格），生成 ${count} 道选择题，重点考察上下文逻辑、固定搭配和熟词僻义`,
    reading: `生成${cat}阅读理解，提供约500词学术性文章（放passage字段），生成 ${count} 道选择题，含主旨题、细节题、推断题、词义题，设置反向逻辑陷阱`,
    new_type_match: `生成${cat}新题型信息匹配，提供分段文章（放passage字段），生成 ${count} 道段落匹配选择题`,
    new_type_summary: `生成${cat}英译汉题，每题给出含从句嵌套的英文长难句，answer给参考译文，explanation详细拆解句子结构`,
    writing_small: `生成 ${count} 道${cat}小作文题，给出写作情境（书信/通知/备忘录），answer给参考范文，explanation给写作格式要点`,
    writing_big: category === 'kaoyan1'
      ? `生成 ${count} 道${cat}图画大作文题，描述漫画内容，answer给写作框架，explanation给高分要点`
      : `生成 ${count} 道${cat}图表大作文题，描述数据图表，answer给写作框架，explanation给高分要点`,
  }
  const instruction = typePrompts[type] ?? `生成 ${count} 道${cat}选择题`
  return `你是专业的${cat}出题专家。${instruction}。

严格按以下JSON格式返回，不输出其他内容：
{"questions":[{"passage":"原文或空字符串","content":"题干","options":["A. 选项","B. 选项","C. 选项","D. 选项"],"answer":"A","explanation":"详细中文解析","difficulty":2}]}
difficulty: 1简单 2中等 3困难`
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { category, type, count = 5 } = await req.json()
    if (!categoryLabel[category]) {
      return NextResponse.json({ error: '无效的题目类别' }, { status: 400 })
    }
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: '无效的题目类型' }, { status: 400 })
    }
    const safeCount = Math.max(1, Math.min(20, Number(count) || 5))

    const response = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: buildPrompt(category, type, safeCount) }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    let result
    try {
      const content = response.choices[0].message.content ?? '{}'
      result = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw content:', response.choices[0].message.content?.substring(0, 500))
      return NextResponse.json({ error: 'AI返回格式错误，请重试' }, { status: 500 })
    }

    const questions = result.questions ?? []
    if (questions.length === 0) {
      return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 })
    }
    const supabase = await createClient()
    const rows = questions.map((q: { passage?: string; content: string; options?: string[]; answer: string; explanation: string; difficulty?: number }) => {
      let passage = q.passage || null
      // 对 reading_cloze 类型，确保 passage 有10个空格
      if (type === 'reading_cloze' && passage) {
        const blankCount = (passage.match(/\[blank\]/gi) || []).length
        if (blankCount < 10) {
          // 如果空格不足10个，在句子结尾随机插入更多空格
          const sentences = passage.split(/(?<=[.!?])\s+/)
          let added = 0
          for (let i = sentences.length - 1; i >= 0 && blankCount + added < 10; i--) {
            const words = sentences[i].split(/\s+/)
            if (words.length > 5) {
              const pos = Math.floor(words.length * 0.6)
              words[pos] = '[blank]'
              sentences[i] = words.join(' ')
              added++
            }
          }
          passage = sentences.join(' ')
        }
      }
      return {
        category, type,
        passage,
        content: q.content,
        options: q.options ?? [],
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty ?? 2,
      }
    })
    const { data, error } = await supabase.from('questions').insert(rows).select('id')
    if (error) throw error
    return NextResponse.json({ count: data.length, message: `成功生成 ${data.length} 道题目` })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ error: '生成题目失败，请稍后重试' }, { status: 500 })
  }
}

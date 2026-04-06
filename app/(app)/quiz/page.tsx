'use client'
import { useState } from 'react'
import Link from 'next/link'

const CET_TYPES = {
  cet4: {
    label: 'CET-4 四级',
    score: '满分710分 · 130分钟',
    color: '#8b5cf6',
    sections: [
      {
        name: '写作 Writing', weight: '15%', types: [
          { key: 'writing', label: '议论文写作', desc: '120词左右，考察观点表达与论证' },
        ]
      },
      {
        name: '听力 Listening', weight: '35% ⭐核心', types: [
          { key: 'listening_news', label: '新闻听力', desc: '3段新闻，每段2-3题，语速快' },
          { key: 'listening_interview', label: '长对话', desc: '2段长对话，每段3-4题' },
          { key: 'listening_passage', label: '听力短文', desc: '3篇短文，每篇3-4题' },
        ]
      },
      {
        name: '阅读 Reading', weight: '35%', types: [
          { key: 'reading_match', label: '信息匹配', desc: '段落信息匹配，考察快速定位' },
          { key: 'reading_choice', label: '仔细阅读', desc: '2篇文章，每篇5题，同义替换' },
          { key: 'reading_cloze', label: '篇章词汇', desc: '15空完形，词汇与语境理解' },
        ]
      },
      {
        name: '翻译 Translation', weight: '15%', types: [
          { key: 'translation', label: '段落汉译英', desc: '约140-160字中文段落翻译成英文' },
        ]
      },
    ]
  },
  cet6: {
    label: 'CET-6 六级',
    score: '满分710分 · 130分钟',
    color: '#06b6d4',
    sections: [
      {
        name: '写作 Writing', weight: '15%', types: [
          { key: 'writing', label: '议论文写作', desc: '150词左右，难度高于四级' },
        ]
      },
      {
        name: '听力 Listening', weight: '35% ⭐核心', types: [
          { key: 'listening_news', label: '新闻听力', desc: '3段新闻，语速更快，词汇更难' },
          { key: 'listening_interview', label: '长对话', desc: '2段长对话，话题更复杂' },
          { key: 'listening_passage', label: '听力短文', desc: '3篇短文，学术性更强' },
        ]
      },
      {
        name: '阅读 Reading', weight: '35%', types: [
          { key: 'reading_match', label: '信息匹配', desc: '段落信息匹配，文章更长' },
          { key: 'reading_choice', label: '仔细阅读', desc: '2篇文章，逻辑推断题更多' },
          { key: 'reading_cloze', label: '篇章词汇', desc: '15空完形，熟词僻义考察' },
        ]
      },
      {
        name: '翻译 Translation', weight: '15%', types: [
          { key: 'translation', label: '段落汉译英', desc: '约180-200字，涉及中国文化' },
        ]
      },
    ]
  }
}

const KAOYAN_TYPES = {
  kaoyan1: {
    label: '考研英语一',
    score: '满分100分 · 180分钟',
    color: '#f472b6',
    focus: '学术深度 · 长难句 · 逻辑推理',
    sections: [
      {
        name: '完形填空 Cloze', weight: '10分', types: [
          { key: 'cloze', label: '完形填空', desc: '20空，考察上下文逻辑与词汇辨析，难度极高' },
        ]
      },
      {
        name: '阅读理解 Reading', weight: '40分 ⭐绝对核心', types: [
          { key: 'reading', label: 'Part A 传统阅读', desc: '4篇文章各5题，反向逻辑陷阱多，熟词僻义' },
          { key: 'new_type_match', label: 'Part B 信息匹配/排序', desc: '段落排序或小标题匹配，考察篇章逻辑' },
          { key: 'new_type_summary', label: 'Part C 英译汉', desc: '5句长难句翻译，结构拆解是关键' },
        ]
      },
      {
        name: '写作 Writing', weight: '30分', types: [
          { key: 'writing_small', label: '小作文 (10分)', desc: '应用文：书信、备忘录、通知等，约100词' },
          { key: 'writing_big', label: '大作文 (20分)', desc: '图画作文：描述图画+分析寓意+表明立场，约160词' },
        ]
      },
    ]
  },
  kaoyan2: {
    label: '考研英语二',
    score: '满分100分 · 180分钟',
    color: '#34d399',
    focus: '实际应用 · 图表分析 · 段落翻译',
    sections: [
      {
        name: '完形填空 Cloze', weight: '10分', types: [
          { key: 'cloze', label: '完形填空', desc: '20空，难度低于英语一，偏实用语境' },
        ]
      },
      {
        name: '阅读理解 Reading', weight: '40分 ⭐绝对核心', types: [
          { key: 'reading', label: 'Part A 传统阅读', desc: '4篇文章各5题，偏实用文体，逻辑相对直接' },
          { key: 'new_type_match', label: 'Part B 新题型', desc: '信息匹配或段落排序，考察整体理解' },
          { key: 'translation', label: 'Part C 段落翻译', desc: '翻译一段约150词的英文段落，偏实用文体' },
        ]
      },
      {
        name: '写作 Writing', weight: '30分', types: [
          { key: 'writing_small', label: '小作文 (10分)', desc: '应用文写作，格式规范，约100词' },
          { key: 'writing_big', label: '大作文 (20分)', desc: '图表作文：描述数据趋势+分析原因+总结，约160词' },
        ]
      },
    ]
  }
}

type GenState = { loading: boolean; message: string }

export default function QuizPage() {
  const [activeTab, setActiveTab] = useState<'cet' | 'kaoyan'>('cet')
  const [genState, setGenState] = useState<Record<string, GenState>>({})
  const [showGen, setShowGen] = useState(false)

  async function handleGenerate(category: string, type: string, count = 5) {
    const key = `${category}_${type}`
    setGenState(s => ({ ...s, [key]: { loading: true, message: '' } }))
    try {
      const res = await fetch('/api/generate/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, type, count }),
      })
      const data = await res.json()
      setGenState(s => ({ ...s, [key]: { loading: false, message: data.message ?? data.error ?? '完成' } }))
    } catch {
      setGenState(s => ({ ...s, [key]: { loading: false, message: '生成失败' } }))
    }
  }

  const tabs = [
    { key: 'cet', label: '四六级 CET', icon: '🎧' },
    { key: 'kaoyan', label: '考研英语', icon: '📖' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#f1f5f9' }}>刷题练习</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>按真实考试题型分类练习</p>
        </div>
        <button onClick={() => setShowGen(v => !v)}
          className="glass px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
          🤖 AI 生成题目
        </button>
      </div>

      <div className="flex gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as 'cet' | 'kaoyan')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={activeTab === t.key
              ? { background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'cet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(CET_TYPES).map(([catKey, cat]) => (
            <div key={catKey} className="glass rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${cat.color}25` }}>
              <div className="px-6 py-4" style={{ background: `${cat.color}10`, borderBottom: `1px solid ${cat.color}20` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-lg" style={{ color: cat.color }}>{cat.label}</h2>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{cat.score}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}>
                    {catKey.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {cat.sections.map(sec => (
                  <div key={sec.name}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold" style={{ color: '#475569' }}>{sec.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ color: sec.weight.includes('⭐') ? '#fbbf24' : '#475569', background: 'rgba(255,255,255,0.05)' }}>
                        {sec.weight}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {sec.types.map(t => {
                        const key = `${catKey}_${t.key}`
                        const gs = genState[key]
                        return (
                          <div key={t.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Link href={`/quiz/${catKey}/${t.key}`} className="flex-1 min-w-0">
                              <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{t.label}</div>
                              <div className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>{t.desc}</div>
                            </Link>
                            <div className="flex items-center gap-2 shrink-0">
                              {gs?.message && (
                                <span className="text-xs" style={{ color: gs.message.includes('成功') ? '#34d399' : '#f87171' }}>
                                  {gs.message}
                                </span>
                              )}
                              {showGen && (
                                <button onClick={() => handleGenerate(catKey, t.key)}
                                  disabled={gs?.loading}
                                  className="text-xs px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-50"
                                  style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}>
                                  {gs?.loading ? '...' : 'AI生成'}
                                </button>
                              )}
                              <Link href={`/quiz/${catKey}/${t.key}`}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                                style={{ color: '#fff', background: `${cat.color}` }}>
                                练习
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'kaoyan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(KAOYAN_TYPES).map(([catKey, cat]) => (
            <div key={catKey} className="glass rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${cat.color}25` }}>
              <div className="px-6 py-4" style={{ background: `${cat.color}10`, borderBottom: `1px solid ${cat.color}20` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-lg" style={{ color: cat.color }}>{cat.label}</h2>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{cat.score}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{cat.focus}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}>
                    {catKey === 'kaoyan1' ? '英语一' : '英语二'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {cat.sections.map(sec => (
                  <div key={sec.name}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold" style={{ color: '#475569' }}>{sec.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ color: sec.weight.includes('⭐') ? '#fbbf24' : '#475569', background: 'rgba(255,255,255,0.05)' }}>
                        {sec.weight}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {sec.types.map(t => {
                        const key = `${catKey}_${t.key}`
                        const gs = genState[key]
                        return (
                          <div key={t.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Link href={`/quiz/${catKey}/${t.key}`} className="flex-1 min-w-0">
                              <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{t.label}</div>
                              <div className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>{t.desc}</div>
                            </Link>
                            <div className="flex items-center gap-2 shrink-0">
                              {gs?.message && (
                                <span className="text-xs" style={{ color: gs.message.includes('成功') ? '#34d399' : '#f87171' }}>
                                  {gs.message}
                                </span>
                              )}
                              {showGen && (
                                <button onClick={() => handleGenerate(catKey, t.key)}
                                  disabled={gs?.loading}
                                  className="text-xs px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-50"
                                  style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}>
                                  {gs?.loading ? '...' : 'AI生成'}
                                </button>
                              )}
                              <Link href={`/quiz/${catKey}/${t.key}`}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                                style={{ color: '#fff', background: cat.color }}>
                                练习
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

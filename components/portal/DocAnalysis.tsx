'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onBack: () => void
}

interface AnalysisResult {
  keywords: { term: string; frequency: number; explanation: string }[]
  techTerms: { term: string; category: string; definition: string }[]
  complexSentences: { sentence: string; breakdown: string; translation: string }[]
  learningPath: { stage: number; title: string; tasks: string[]; focus: string }[]
  summary: string
}

type TabType = 'keywords' | 'terms' | 'sentences' | 'path'

const TAB_LABELS: { id: TabType; label: string; icon: string }[] = [
  { id: 'keywords', label: '高频关键词', icon: '🔑' },
  { id: 'terms', label: '专业术语', icon: '📌' },
  { id: 'sentences', label: '长难句解析', icon: '🔬' },
  { id: 'path', label: '学习路径', icon: '🗺️' },
]

export default function DocAnalysis({ onBack }: Props) {
  const [docText, setDocText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('keywords')
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!docText.trim() || isAnalyzing) return
    setIsAnalyzing(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/portal/doc-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: docText.trim() }),
      })
      if (!res.ok) throw new Error('分析失败，请稍后重试')
      const data = await res.json()
      setResult(data)
      setActiveTab('keywords')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发生未知错误')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex w-full h-screen" style={{ background: '#0d0e1a' }}>
      {/* 侧边栏 */}
      <motion.aside
        className="flex-shrink-0 flex flex-col p-5"
        style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.1)', background: '#0a0b14' }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          ← 返回工作台
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📄</span>
            <h2 className="font-bold text-base" style={{ color: '#f1f5f9' }}>智能文档解析</h2>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
            导入英文技术文档或开源代码注释，AI 自动提取高频词汇、专业术语与长难句，并生成个性化学习路径。
          </p>
        </div>

        <div className="glass rounded-xl p-4 mb-4" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
          <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#a78bfa' }}>支持文档类型</h4>
          <ul className="text-xs space-y-2" style={{ color: '#64748b' }}>
            <li className="flex items-center gap-2">
              <span style={{ color: '#22d3ee' }}>•</span> 官方技术文档（RFC、Man Page）
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: '#22d3ee' }}>•</span> 开源库 README / 注释
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: '#22d3ee' }}>•</span> 学术论文摘要
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: '#22d3ee' }}>•</span> API 接口说明文档
            </li>
          </ul>
        </div>

        {result && (
          <div className="glass rounded-xl p-4" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
            <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#22d3ee' }}>分析概览</h4>
            <div className="space-y-2">
              {[
                { label: '高频关键词', value: result.keywords.length, icon: '🔑' },
                { label: '专业术语', value: result.techTerms.length, icon: '📌' },
                { label: '长难句', value: result.complexSentences.length, icon: '🔬' },
                { label: '学习阶段', value: result.learningPath.length, icon: '🗺️' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#64748b' }}>{item.icon} {item.label}</span>
                  <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 输入区 */}
        <motion.div
          className="p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0c0d18' }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>粘贴或输入英文技术文档</h3>
              <span className="text-xs" style={{ color: '#475569' }}>{docText.length} 字符</span>
            </div>
            <textarea
              value={docText}
              onChange={e => setDocText(e.target.value)}
              placeholder="在此粘贴英文技术文档、开源代码注释或 API 文档内容…&#10;&#10;例：The malloc() function allocates size bytes of uninitialized storage. If allocation succeeds, returns a pointer that is suitably aligned for any scalar type..."
              className="input-dark w-full rounded-xl px-4 py-3 text-sm resize-none font-mono"
              style={{ height: 140, lineHeight: '1.6' }}
              disabled={isAnalyzing}
            />
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setDocText('')}
                className="text-xs transition-colors"
                style={{ color: '#475569' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >
                清空
              </button>
              <button
                onClick={analyze}
                disabled={!docText.trim() || isAnalyzing}
                className="btn-glow px-8 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ minWidth: 140 }}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    AI 解析中…
                  </span>
                ) : '开始智能解析'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 结果区 */}
        <div className="flex-1 overflow-y-auto">
          {!result && !isAnalyzing && !error && (
            <motion.div
              className="flex flex-col items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl mb-4 opacity-20">📡</div>
              <p className="text-sm" style={{ color: '#475569' }}>粘贴文档后点击「开始智能解析」</p>
            </motion.div>
          )}

          {error && (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
            </div>
          )}

          {isAnalyzing && (
            <motion.div
              className="flex flex-col items-center justify-center h-full gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              </div>
              <p className="text-sm" style={{ color: '#94a3b8' }}>DeepSeek 正在解析文档…</p>
              <p className="text-xs" style={{ color: '#475569' }}>提取关键词、专业术语与长难句</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              className="p-6 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 文档摘要 */}
              <div className="glass rounded-xl p-4 mb-6" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: '#a78bfa' }}>📋 文档概要</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{result.summary}</p>
              </div>

              {/* 标签页 */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {TAB_LABELS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={activeTab === tab.id
                      ? { background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.5)' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* 高频关键词 */}
                {activeTab === 'keywords' && (
                  <motion.div key="keywords" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.keywords.map((kw, i) => (
                        <div key={i} className="glass rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm" style={{ color: '#a5b4fc' }}>{kw.term}</span>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                              ×{kw.frequency}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{kw.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 专业术语 */}
                {activeTab === 'terms' && (
                  <motion.div key="terms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="space-y-3">
                      {result.techTerms.map((term, i) => (
                        <div key={i} className="glass rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono font-bold" style={{ color: '#22d3ee' }}>{term.term}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(34,211,238,0.1)', color: '#67e8f9', border: '1px solid rgba(34,211,238,0.3)' }}>
                              {term.category}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{term.definition}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 长难句解析 */}
                {activeTab === 'sentences' && (
                  <motion.div key="sentences" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="space-y-4">
                      {result.complexSentences.map((s, i) => (
                        <div key={i} className="glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="mb-3">
                            <span className="text-xs uppercase tracking-wide font-semibold mr-2" style={{ color: '#475569' }}>原句</span>
                            <p className="text-sm font-mono leading-relaxed mt-1" style={{ color: '#f1f5f9' }}>&ldquo;{s.sentence}&rdquo;</p>
                          </div>
                          <div className="mb-3 pl-3" style={{ borderLeft: '2px solid rgba(99,102,241,0.4)' }}>
                            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#475569' }}>结构拆解</span>
                            <p className="text-xs leading-relaxed mt-1" style={{ color: '#a78bfa' }}>{s.breakdown}</p>
                          </div>
                          <div className="pl-3" style={{ borderLeft: '2px solid rgba(34,211,238,0.4)' }}>
                            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#475569' }}>参考译文</span>
                            <p className="text-sm leading-relaxed mt-1" style={{ color: '#67e8f9' }}>{s.translation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 学习路径 */}
                {activeTab === 'path' && (
                  <motion.div key="path" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="space-y-4">
                      {result.learningPath.map((stage, i) => (
                        <div key={i} className="glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                              style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                              {stage.stage}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-sm" style={{ color: '#f1f5f9' }}>{stage.title}</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>
                                  {stage.focus}
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {stage.tasks.map((task, j) => (
                                  <li key={j} className="text-xs flex items-start gap-2" style={{ color: '#64748b' }}>
                                    <span style={{ color: '#6366f1' }}>›</span>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

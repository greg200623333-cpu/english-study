'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSpeech } from '@/lib/useSpeech'

type ListeningQuestion = {
  content: string
  options: string[]
  answer: string
  explanation: string
}
type Passage = {
  text: string
  title: string
  questions: ListeningQuestion[]
}

const typeLabel: Record<string, string> = {
  listening_news: '新闻听力',
  listening_interview: '长对话',
  listening_passage: '听力短文',
}
const catLabel: Record<string, string> = {
  cet4: '四级 CET-4',
  cet6: '六级 CET-6',
}

function VoiceGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-strong rounded-2xl p-7 max-w-md w-full"
        style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
            🎧
          </div>
          <div>
            <h3 className="font-extrabold text-lg" style={{ color: '#f1f5f9' }}>听力朗读配置</h3>
            <p className="text-xs" style={{ color: '#64748b' }}>首次使用需确认语音包已安装</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            本功能使用浏览器内置 <span style={{ color: '#22d3ee' }}>Web Speech API</span> 朗读英文，
            <strong style={{ color: '#f1f5f9' }}>无需下载任何软件</strong>，但需要 Windows 安装英语语音包。
          </p>

          <div className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>检查 / 安装英语语音包：</p>
            {[
              { step: '1', text: '开始菜单 → 设置（⚙️）' },
              { step: '2', text: '时间和语言 → 语音' },
              { step: '3', text: '查看「语音语言」是否有 English (United States)' },
              { step: '4', text: '没有则点「添加语音」搜索 English 安装' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                  {s.step}
                </span>
                <span className="text-sm" style={{ color: '#cbd5e1' }}>{s.text}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <span style={{ color: '#22d3ee' }}>💡</span>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              推荐使用 <strong style={{ color: '#f1f5f9' }}>Chrome 或 Edge</strong> 浏览器，英文发音效果最佳。
              Mac / iPhone 用户无需额外配置，系统自带英语语音。
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="btn-glow flex-1 py-2.5 rounded-xl text-white font-bold text-sm">
            已安装，开始练习
          </button>
          <button onClick={onClose}
            className="glass px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
            跳过
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ListeningPage() {
  const { category, type } = useParams<{ category: string; type: string }>()
  const router = useRouter()
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const checked = sessionStorage.getItem('voice_checked')
    if (checked) return
    sessionStorage.setItem('voice_checked', '1')
    const check = () => {
      const voices = window.speechSynthesis.getVoices()
      const hasEn = voices.some(v => v.lang.startsWith('en'))
      if (!hasEn) setShowGuide(true)
    }
    if (window.speechSynthesis.getVoices().length > 0) {
      check()
    } else {
      window.speechSynthesis.onvoiceschanged = check
    }
  }, [])
  const { speak, stop, speaking } = useSpeech()

  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(false)
  const [passageIndex, setPassageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showText, setShowText] = useState(false)
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [speed, setSpeed] = useState(0.9)

  async function generate() {
    setLoading(true)
    setPassages([])
    setAnswers({})
    setSubmitted(false)
    setShowText(false)
    setPassageIndex(0)
    try {
      const res = await fetch('/api/generate/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, type, count: 2 }),
      })
      const data = await res.json()
      setPassages(data.passages ?? [])
    } catch {
      alert('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  function handlePlay(idx: number) {
    if (playingIdx === idx && speaking) {
      stop()
      setPlayingIdx(null)
      return
    }
    const p = passages[passageIndex]
    if (!p) return
    setPlayingIdx(idx)
    speak(p.text, speed)
    const estimatedMs = (p.text.split(' ').length / (speed * 2.5)) * 1000
    setTimeout(() => setPlayingIdx(null), estimatedMs + 500)
  }

  function handleAnswer(qIdx: number, opt: string) {
    if (submitted) return
    setAnswers(a => ({ ...a, [`${passageIndex}_${qIdx}`]: opt }))
  }

  function handleSubmit() {
    setSubmitted(true)
    setShowText(true)
  }

  const p = passages[passageIndex]
  const correctCount = p ? p.questions.filter((q, i) => answers[`${passageIndex}_${i}`]?.[0] === q.answer).length : 0

  return (
    <div className="max-w-3xl mx-auto">
      {showGuide && <VoiceGuideModal onClose={() => setShowGuide(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/quiz')} className="text-sm" style={{ color: '#475569' }}>← 返回</button>
          <span className="font-bold" style={{ color: '#a78bfa' }}>{catLabel[category]}</span>
          <span className="text-xs px-2 py-0.5 rounded-lg" style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>
            {typeLabel[type] ?? type}
          </span>
        </div>
        <button onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all glass"
          style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
          🔊 语音配置
        </button>
      </div>

      {passages.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-6">🎧</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9' }}>听力练习</h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            由 DeepSeek AI 生成听力材料，浏览器朗读播放
          </p>
          <button onClick={generate} disabled={loading}
            className="btn-glow px-8 py-3 rounded-xl text-white font-bold disabled:opacity-50">
            {loading ? '🤖 AI 生成听力材料中...' : '生成听力材料'}
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-20" style={{ color: '#64748b' }}>
          <div className="text-4xl mb-4 animate-pulse">🤖</div>
          <p>DeepSeek 正在生成听力材料...</p>
        </div>
      )}

      {p && !loading && (
        <div>
          {passages.length > 1 && (
            <div className="flex gap-2 mb-5">
              {passages.map((_, i) => (
                <button key={i} onClick={() => { setPassageIndex(i); setSubmitted(false); setShowText(false); setAnswers({}) }}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={passageIndex === i
                    ? { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                  材料 {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="glass rounded-2xl p-5 mb-5" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold" style={{ color: '#f1f5f9' }}>{p.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  {p.text.split(' ').length} 词 · {p.questions.length} 题
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#475569' }}>语速</span>
                  {[0.7, 0.9, 1.1].map(s => (
                    <button key={s} onClick={() => setSpeed(s)}
                      className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                      style={speed === s
                        ? { background: 'rgba(34,211,238,0.2)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.4)' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {s === 0.7 ? '慢' : s === 0.9 ? '正常' : '快'}
                    </button>
                  ))}
                </div>
                <button onClick={() => handlePlay(passageIndex)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all"
                  style={{
                    background: playingIdx === passageIndex && speaking
                      ? 'rgba(34,211,238,0.2)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                    color: '#fff',
                    boxShadow: playingIdx === passageIndex && speaking ? '0 0 20px rgba(34,211,238,0.4)' : 'none',
                  }}>
                  {playingIdx === passageIndex && speaking ? '⏸' : '▶'}
                </button>
              </div>
            </div>

            <div>
              <button onClick={() => setShowText(v => !v)}
                className="text-xs font-medium transition-all"
                style={{ color: showText ? '#22d3ee' : '#475569' }}>
                {showText ? '▲ 隐藏原文' : '▼ 显示原文（建议答题后查看）'}
              </button>
              {showText && (
                <div className="mt-3 p-4 rounded-xl text-sm leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {p.text}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-5">
            {p.questions.map((q, qi) => {
              const userAns = answers[`${passageIndex}_${qi}`]
              return (
                <div key={qi} className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>
                    {qi + 1}. {q.content}
                  </p>
                  <div className="space-y-2">
                    {q.options.map(opt => {
                      const letter = opt[0]
                      let borderColor = 'rgba(255,255,255,0.08)'
                      let bg = 'rgba(255,255,255,0.03)'
                      let color = '#94a3b8'
                      if (submitted) {
                        if (letter === q.answer) { borderColor = 'rgba(52,211,153,0.5)'; bg = 'rgba(52,211,153,0.08)'; color = '#34d399' }
                        else if (opt === userAns) { borderColor = 'rgba(248,113,113,0.5)'; bg = 'rgba(248,113,113,0.08)'; color = '#f87171' }
                        else { color = '#334155' }
                      } else if (opt === userAns) {
                        borderColor = 'rgba(139,92,246,0.5)'; bg = 'rgba(139,92,246,0.08)'; color = '#a78bfa'
                      }
                      return (
                        <button key={opt} onClick={() => handleAnswer(qi, opt)} disabled={submitted}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                          style={{ border: `1px solid ${borderColor}`, background: bg, color }}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {submitted && (
                    <div className="mt-3 text-xs leading-relaxed" style={{ color: '#64748b' }}>
                      <span className="font-bold" style={{ color: '#a78bfa' }}>解析：</span>{q.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {!submitted ? (
            <button onClick={handleSubmit}
              disabled={Object.keys(answers).filter(k => k.startsWith(`${passageIndex}_`)).length < p.questions.length}
              className="btn-glow w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40">
              提交答案
            </button>
          ) : (
            <div className="glass rounded-2xl p-5 text-center" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
              <div className="text-3xl font-extrabold gradient-text mb-1">
                {correctCount} / {p.questions.length}
              </div>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>本段得分</p>
              <div className="flex gap-3 justify-center">
                <button onClick={generate} className="btn-glow px-5 py-2.5 rounded-xl text-white font-bold text-sm">
                  换一组材料
                </button>
                <button onClick={() => router.push('/quiz')}
                  className="glass px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                  返回选题
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

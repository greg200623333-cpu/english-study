'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useYoudaoTTS } from '@/lib/useYoudaoTTS'
import { useWarRoomSync } from '@/hooks/useWarRoomSync'
import { useMissionStore } from '@/stores/useMissionStore'

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

// Shape of questions in local archive JSON
type ArchiveQuestion = {
  number: number
  part: string
  section: string
  context: string
  question: string
  options: string[]
  type: string
  passage?: string | null
  correctAnswer?: string
  explanation?: string
  set?: number
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-strong w-full max-w-md rounded-2xl p-7" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>🎧</div>
          <div>
            <h3 className="text-lg font-extrabold" style={{ color: '#f1f5f9' }}>听力朗读配置</h3>
            <p className="text-xs" style={{ color: '#64748b' }}>使用有道 TTS 提供高质量语音</p>
          </div>
        </div>
        <p className="mb-6 text-sm" style={{ color: '#94a3b8' }}>听力材料将通过有道 TTS API 播放，提供更自然流畅的英语发音。</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-glow flex-1 rounded-xl py-2.5 text-sm font-bold text-white">开始练习</button>
          <button onClick={onClose} className="glass rounded-xl px-4 py-2.5 text-sm font-medium" style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>跳过</button>
        </div>
      </div>
    </div>
  )
}

export default function ListeningPage() {
  const { category, type } = useParams<{ category: string; type: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const archiveId = searchParams.get('archiveId')
  const [showGuide, setShowGuide] = useState(false)
  const { speak, stop, speaking, changeSpeed, state } = useYoudaoTTS()
  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(false)
  const [passageIndex, setPassageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showText, setShowText] = useState(false)
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [speed, setSpeed] = useState(0.9)
  const { syncQuizAttempt } = useWarRoomSync()
  const { activeMission } = useMissionStore()

  // Auto-generate in AI mode
  useEffect(() => {
    if (activeMission?.isAiMode && !archiveId && passages.length === 0) {
      generate()
    }
  }, [activeMission]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load archive questions on mount if archiveId is present
  useEffect(() => {
    if (archiveId) {
      loadArchive()
    }
  }, [archiveId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadArchive() {
    setLoading(true)
    try {
      const fileId = archiveId!.replace('.', '-')
      const res = await fetch(`/data/${category}-${fileId}.json`)
      if (!res.ok) throw new Error('文件不存在')
      const data: ArchiveQuestion[] = await res.json()

      // Filter to the correct listening sub-type
      const sectionMap: Record<string, string> = {
        listening_news: 'Section A',
        listening_interview: 'Section B',
        listening_passage: 'Section C',
      }
      const targetSection = sectionMap[type]
      const filtered = data.filter(q => q.type === 'listening' && (!targetSection || q.section === targetSection))

      // Group by context (each context = one passage group)
      const groups: Record<string, ArchiveQuestion[]> = {}
      for (const q of filtered) {
        const key = q.context ?? `group_${q.number}`
        if (!groups[key]) groups[key] = []
        groups[key].push(q)
      }

      const builtPassages: Passage[] = Object.entries(groups).map(([ctx, qs]) => {
        // Use passage field from first question if available, otherwise use context
        const audioText = qs[0]?.passage ?? ctx
        return {
          title: ctx,
          text: audioText,
          questions: qs.map(q => ({
            content: q.question,
            options: q.options,
            answer: q.correctAnswer ?? '',
            explanation: q.explanation ?? '',
          })),
        }
      })

      setPassages(builtPassages)
    } catch {
      alert('加载真题失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Stop audio when component unmounts or passage changes
    return () => {
      stop()
      setPlayingIdx(null)
    }
  }, [passageIndex, stop])

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
    const passage = passages[passageIndex]
    if (!passage) return
    setPlayingIdx(idx)
    speak(passage.text, speed)
  }

  function handleAnswer(questionIndex: number, option: string) {
    if (submitted) return
    setAnswers((current) => ({ ...current, [`${passageIndex}_${questionIndex}`]: option }))
  }

  async function handleSubmit() {
    const passage = passages[passageIndex]
    const correctCount = passage.questions.filter((question, idx) => answers[`${passageIndex}_${idx}`]?.[0] === question.answer).length
    setSubmitted(true)
    setShowText(true)
    await syncQuizAttempt({
      type,
      category,
      correct: correctCount,
      total: passage.questions.length,
      passageWordCount: passage.text.split(/\s+/).filter(Boolean).length,
    })
  }

  const passage = passages[passageIndex]
  const correctCount = passage ? passage.questions.filter((question, idx) => answers[`${passageIndex}_${idx}`]?.[0] === question.answer).length : 0

  return (
    <div className="mx-auto max-w-3xl">
      {showGuide && <VoiceGuideModal onClose={() => setShowGuide(false)} />}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/quiz')} className="text-sm" style={{ color: '#475569' }}>← 返回</button>
          <span className="font-bold" style={{ color: '#a78bfa' }}>{catLabel[category] ?? category}</span>
          <span className="rounded-lg px-2 py-0.5 text-xs" style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>{typeLabel[type] ?? type}</span>
          {archiveId && <span className="rounded-lg px-2 py-0.5 text-xs" style={{ color: '#22d3ee', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)' }}>档案 {archiveId}</span>}
        </div>
        <button onClick={() => setShowGuide(true)} className="glass flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all" style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>🎙 语音配置</button>
      </div>

      {passages.length === 0 && !loading && (
        <div className="py-20 text-center">
          <div className="mb-6 text-5xl">🎧</div>
          <h2 className="mb-2 text-xl font-bold" style={{ color: '#f1f5f9' }}>听力练习</h2>
          {archiveId ? (
            <p className="mb-8 text-sm" style={{ color: '#64748b' }}>档案 {archiveId} 暂无该类型听力题目</p>
          ) : (
            <>
              <p className="mb-8 text-sm" style={{ color: '#64748b' }}>生成听力材料后，提交结果会同步到战情室听力产能。</p>
              <button onClick={generate} className="btn-glow rounded-xl px-8 py-3 font-bold text-white">生成听力材料</button>
            </>
          )}
        </div>
      )}

      {loading && <div className="py-20 text-center" style={{ color: '#64748b' }}>生成听力材料中...</div>}

      {passage && !loading && (
        <div>
          {passages.length > 1 && (
            <div className="mb-5 flex gap-2">
              {passages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPassageIndex(idx)
                    setSubmitted(false)
                    setShowText(false)
                    setAnswers({})
                  }}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
                  style={passageIndex === idx ? { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  材料 {idx + 1}
                </button>
              ))}
            </div>
          )}

          <div className="glass mb-5 rounded-2xl p-5" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold" style={{ color: '#f1f5f9' }}>{passage.title}</h3>
                <p className="mt-0.5 text-xs" style={{ color: '#475569' }}>{passage.questions.length} 题</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#475569' }}>语速</span>
                  {[0.7, 0.9, 1.1].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSpeed(value)
                        changeSpeed(value)
                      }}
                      className="rounded-lg px-2 py-1 text-xs font-bold transition-all"
                      style={speed === value ? { background: 'rgba(34,211,238,0.2)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.4)' } : { background: 'rgba(255,255,255,0.05)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {value === 0.7 ? '慢' : value === 0.9 ? '正常' : '快'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePlay(passageIndex)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold transition-all"
                  style={{
                    background: playingIdx === passageIndex && speaking ? 'rgba(34,211,238,0.2)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                    color: '#fff',
                    boxShadow: playingIdx === passageIndex && speaking ? '0 0 20px rgba(34,211,238,0.4)' : 'none',
                  }}
                  disabled={state === 'loading'}
                >
                  {state === 'loading' ? '...' : playingIdx === passageIndex && speaking ? '■' : '▶'}
                </button>
              </div>
            </div>

            <>
              <button onClick={() => setShowText((value) => !value)} className="text-xs font-medium transition-all" style={{ color: showText ? '#22d3ee' : '#475569' }}>
                {showText ? '▲ 隐藏原文' : '▼ 显示原文'}
              </button>
              {showText && <div className="mt-3 rounded-xl p-4 text-sm leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>{passage.text}</div>}
            </>
          </div>

          <div className="mb-5 space-y-4">
            {passage.questions.map((question, questionIndex) => {
              const userAnswer = answers[`${passageIndex}_${questionIndex}`]
              return (
                <div key={questionIndex} className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="mb-3 text-sm font-semibold" style={{ color: '#e2e8f0' }}>{questionIndex + 1}. {question.content}</p>
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const letter = option[0]
                      let borderColor = 'rgba(255,255,255,0.08)'
                      let background = 'rgba(255,255,255,0.03)'
                      let color = '#94a3b8'
                      if (submitted) {
                        if (letter === question.answer) {
                          borderColor = 'rgba(52,211,153,0.5)'
                          background = 'rgba(52,211,153,0.08)'
                          color = '#34d399'
                        } else if (option === userAnswer) {
                          borderColor = 'rgba(248,113,113,0.5)'
                          background = 'rgba(248,113,113,0.08)'
                          color = '#f87171'
                        } else {
                          color = '#334155'
                        }
                      } else if (option === userAnswer) {
                        borderColor = 'rgba(139,92,246,0.5)'
                        background = 'rgba(139,92,246,0.08)'
                        color = '#a78bfa'
                      }
                      return (
                        <button key={option} onClick={() => handleAnswer(questionIndex, option)} disabled={submitted} className="w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all" style={{ border: `1px solid ${borderColor}`, background, color }}>
                          {option}
                        </button>
                      )
                    })}
                  </div>
                  {submitted && <div className="mt-3 text-xs leading-relaxed" style={{ color: '#64748b' }}><span className="font-bold" style={{ color: '#a78bfa' }}>解析：</span>{question.explanation}</div>}
                </div>
              )
            })}
          </div>

          {!submitted ? (
            <button onClick={handleSubmit} disabled={Object.keys(answers).filter((key) => key.startsWith(`${passageIndex}_`)).length < passage.questions.length} className="btn-glow w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40">
              提交答案
            </button>
          ) : (
            <div className="glass rounded-2xl p-5 text-center" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
              <div className="gradient-text mb-1 text-3xl font-extrabold">{correctCount} / {passage.questions.length}</div>
              <p className="mb-4 text-sm" style={{ color: '#64748b' }}>本段得分</p>
              <div className="flex justify-center gap-3">
                {!archiveId && <button onClick={generate} className="btn-glow rounded-xl px-5 py-2.5 text-sm font-bold text-white">换一组材料</button>}
                <button onClick={() => router.push('/quiz')} className="glass rounded-xl px-5 py-2.5 text-sm font-bold" style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>返回选题</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

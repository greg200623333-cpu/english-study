'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpeech } from '@/lib/useSpeech'

type Word = {
  id: number
  word: string
  phonetic: string
  meaning: string
  example: string
  category: string
}
type WordRecord = { word_id: number; status: 'new' | 'learning' | 'known' }

const categories = [
  { key: 'all', label: '全部' },
  { key: 'cet4', label: '四级' },
  { key: 'cet6', label: '六级' },
  { key: 'kaoyan', label: '考研' },
]
const statusLabel = { new: '未学', learning: '学习中', known: '已掌握' }
const statusColor = {
  new: { color: '#64748b', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.2)' },
  learning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
  known: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([])
  const [records, setRecords] = useState<Record<number, WordRecord>>({})
  const [category, setCategory] = useState('all')
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genMessage, setGenMessage] = useState('')
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [showVoiceGuide, setShowVoiceGuide] = useState(false)
  const { speak, stop, speaking } = useSpeech()

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const checked = sessionStorage.getItem('voice_checked')
    if (checked) return
    sessionStorage.setItem('voice_checked', '1')
    const check = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.some(v => v.lang.startsWith('en'))) setShowVoiceGuide(true)
    }
    if (window.speechSynthesis.getVoices().length > 0) check()
    else window.speechSynthesis.onvoiceschanged = check
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      let query = supabase.from('words').select('*')
      if (category !== 'all') query = query.eq('category', category)
      const { data: wordData } = await query.order('id')
      setWords(wordData ?? [])
      if (user) {
        const { data: recData } = await supabase.from('word_records').select('*').eq('user_id', user.id)
        const map: Record<number, WordRecord> = {}
        recData?.forEach(r => { map[r.word_id] = r })
        setRecords(map)
      }
      setLoading(false)
    }
    load()
  }, [category])

  async function updateStatus(wordId: number, status: 'new' | 'learning' | 'known') {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('word_records').upsert(
      { user_id: userId, word_id: wordId, status, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,word_id' }
    )
    setRecords(r => ({ ...r, [wordId]: { word_id: wordId, status } }))
  }

  function handleSpeak(e: React.MouseEvent, w: Word) {
    e.stopPropagation()
    if (speakingId === w.id && speaking) { stop(); setSpeakingId(null); return }
    setSpeakingId(w.id)
    speak(w.word, 0.85)
    setTimeout(() => setSpeakingId(null), 3000)
  }

  function handleSpeakExample(e: React.MouseEvent, w: Word) {
    e.stopPropagation()
    setSpeakingId(w.id)
    speak(w.example, 0.8)
    setTimeout(() => setSpeakingId(null), 8000)
  }

  async function generateWords(cat: string) {
    setGenerating(true)
    setGenMessage('')
    try {
      const res = await fetch('/api/generate/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, count: 10 }),
      })
      const data = await res.json()
      setGenMessage(data.message ?? data.error ?? '完成')
      setCategory(cat)
    } catch {
      setGenMessage('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: '#475569' }}>加载单词中...</div>
  )

  return (
    <div>
      {showVoiceGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-strong rounded-2xl p-7 max-w-md w-full"
            style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>🔊</div>
              <div>
                <h3 className="font-extrabold text-lg" style={{ color: '#f1f5f9' }}>朗读功能配置</h3>
                <p className="text-xs" style={{ color: '#64748b' }}>未检测到英语语音包</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              单词朗读使用浏览器内置 <span style={{ color: '#22d3ee' }}>Web Speech API</span>，
              <strong style={{ color: '#f1f5f9' }}>无需下载软件</strong>，但需安装 Windows 英语语音包。
            </p>
            <div className="rounded-xl p-4 space-y-3 mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>安装步骤：</p>
              {['开始菜单 → 设置（⚙️）', '时间和语言 → 语音', '查看是否有 English (United States)', '没有则点「添加语音」搜索 English 安装'].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>{i + 1}</span>
                  <span className="text-sm" style={{ color: '#cbd5e1' }}>{s}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3 flex gap-2 mb-5"
              style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
              <span style={{ color: '#22d3ee' }}>💡</span>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                推荐 <strong style={{ color: '#f1f5f9' }}>Chrome / Edge</strong> 浏览器，英文发音最佳。Mac 用户无需配置。
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowVoiceGuide(false)}
                className="btn-glow flex-1 py-2.5 rounded-xl text-white font-bold text-sm">
                已安装，开始使用
              </button>
              <button onClick={() => setShowVoiceGuide(false)}
                className="glass px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                跳过
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#f1f5f9' }}>单词学习</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>点击卡片翻转 · 点击 🔊 朗读单词</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => setShowVoiceGuide(true)}
            className="glass px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
            🔊 语音配置
          </button>
          {categories.map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={category === c.key
                ? { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {['cet4', 'cet6', 'kaoyan'].map(cat => (
          <button key={cat} onClick={() => generateWords(cat)} disabled={generating}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 glass"
            style={{ color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
            {generating ? '生成中...' : `AI 生成${cat === 'cet4' ? '四级' : cat === 'cet6' ? '六级' : '考研'}单词`}
          </button>
        ))}
        {genMessage && (
          <span className="text-sm" style={{ color: genMessage.includes('成功') ? '#34d399' : '#f87171' }}>
            {genMessage}
          </span>
        )}
      </div>

      {words.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📭</div>
          <p style={{ color: '#475569' }}>暂无单词，点击上方按钮用 AI 生成</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {words.map(w => {
            const rec = records[w.id]
            const status = rec?.status ?? 'new'
            const sc = statusColor[status]
            const isFlipped = flipped[w.id]
            const isSpeaking = speakingId === w.id && speaking

            return (
              <div key={w.id} className="glass card-hover rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-5 cursor-pointer"
                  onClick={() => setFlipped(f => ({ ...f, [w.id]: !f[w.id] }))}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold" style={{ color: '#f1f5f9' }}>{w.word}</span>
                        <button onClick={e => handleSpeak(e, w)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm"
                          style={{
                            background: isSpeaking ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.06)',
                            color: isSpeaking ? '#22d3ee' : '#475569',
                            border: `1px solid ${isSpeaking ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          }}>
                          {isSpeaking ? '⏸' : '🔊'}
                        </button>
                      </div>
                      <div className="text-sm mt-0.5" style={{ color: '#475569' }}>{w.phonetic}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      {statusLabel[status]}
                    </span>
                  </div>

                  {isFlipped && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="font-semibold mb-2" style={{ color: '#e2e8f0' }}>{w.meaning}</div>
                      <div className="flex items-start gap-2">
                        <div className="text-sm italic flex-1" style={{ color: '#64748b' }}>{w.example}</div>
                        <button onClick={e => handleSpeakExample(e, w)}
                          className="shrink-0 px-2 py-1 rounded-lg text-xs transition-all"
                          style={{ color: '#22d3ee', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
                          🔊 例句
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="text-xs mt-2" style={{ color: '#334155' }}>
                    {isFlipped ? '点击收起' : '点击查看释义'}
                  </div>
                </div>

                <div className="px-5 pb-4 flex gap-2 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {(['learning', 'known'] as const).map(s => (
                    <button key={s} onClick={() => updateStatus(w.id, s)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={status === s
                        ? s === 'known'
                          ? { background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)' }
                          : { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                        : { background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {s === 'learning' ? '学习中' : '已掌握'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

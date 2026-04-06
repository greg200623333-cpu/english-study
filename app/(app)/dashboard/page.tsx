'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Stats = {
  totalQuiz: number
  accuracy: number
  wordStats: { known: number; learning: number; new: number }
  avgScore: number
  recentEssays: { score: number | null; category: string; created_at: string }[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null | undefined>(undefined)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUser(null); return }
      setUser({ id: user.id, email: user.email ?? '' })

      const [quizRes, wordRes, essayRes] = await Promise.all([
        supabase.from('quiz_records').select('is_correct, created_at').eq('user_id', user.id),
        supabase.from('word_records').select('status').eq('user_id', user.id),
        supabase.from('essays').select('score, category, created_at').eq('user_id', user.id),
      ])

      const quizRecords = quizRes.data ?? []
      const wordRecords = wordRes.data ?? []
      const essayRecords = essayRes.data ?? []

      const totalQuiz = quizRecords.length
      const correctQuiz = quizRecords.filter(r => r.is_correct).length
      const accuracy = totalQuiz > 0 ? Math.round((correctQuiz / totalQuiz) * 100) : 0
      const wordStats = {
        known: wordRecords.filter(w => w.status === 'known').length,
        learning: wordRecords.filter(w => w.status === 'learning').length,
        new: wordRecords.filter(w => w.status === 'new').length,
      }
      const avgScore = essayRecords.length > 0
        ? Math.round(essayRecords.reduce((s, e) => s + (e.score ?? 0), 0) / essayRecords.length)
        : 0
      const recentEssays = essayRecords.slice(-5).reverse()

      setStats({ totalQuiz, accuracy, wordStats, avgScore, recentEssays })
    }
    load()
  }, [])

  if (user === undefined) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    </div>
  )

  if (!user) return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: '#f1f5f9' }}>学习概览</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          游客模式 · <Link href="/login" style={{ color: '#a78bfa' }}>登录</Link> 后可保存学习进度
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/quiz', title: '开始刷题', desc: '四六级 & 考研题库', icon: '📝', accent: '#8b5cf6' },
          { href: '/words', title: '背单词', desc: '核心词汇卡片记忆', icon: '📚', accent: '#22d3ee' },
          { href: '/essay', title: '写作文', desc: 'AI 即时批改评分', icon: '✍️', accent: '#34d399' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="glass card-hover rounded-2xl p-5 flex items-center gap-4"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30` }}>
              {item.icon}
            </div>
            <div>
              <div className="font-semibold" style={{ color: '#f1f5f9' }}>{item.title}</div>
              <div className="text-sm" style={{ color: '#64748b' }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#f1f5f9' }}>学习概览</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{user.email}</p>
        </div>
        <Link href="/profile"
          className="glass px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
          style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
          👤 个人信息
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '已做题目', value: stats?.totalQuiz ?? '--', unit: '题', icon: '📝', color: '#8b5cf6' },
          { label: '答题正确率', value: stats?.accuracy ?? '--', unit: '%', icon: '🎯', color: '#22d3ee' },
          { label: '掌握单词', value: stats?.wordStats.known ?? '--', unit: '个', icon: '📚', color: '#34d399' },
          { label: '作文平均分', value: stats ? (stats.avgScore || '--') : '--', unit: stats?.avgScore ? '分' : '', icon: '✍️', color: '#f472b6' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-extrabold" style={{ color: s.color }}>
              {s.value}<span className="text-sm font-normal ml-1" style={{ color: '#475569' }}>{s.unit}</span>
            </div>
            <div className="text-sm mt-1" style={{ color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold mb-4" style={{ color: '#f1f5f9' }}>单词学习进度</h2>
          {!stats ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="h-4 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
            </div>
          ) : stats.wordStats.known + stats.wordStats.learning + stats.wordStats.new === 0 ? (
            <p className="text-sm" style={{ color: '#475569' }}>还没有开始背单词</p>
          ) : (
            <div className="space-y-3">
              {[
                { key: 'known', label: '已掌握', color: '#34d399', count: stats.wordStats.known },
                { key: 'learning', label: '学习中', color: '#fbbf24', count: stats.wordStats.learning },
                { key: 'new', label: '未学习', color: '#475569', count: stats.wordStats.new },
              ].map(item => {
                const total = stats.wordStats.known + stats.wordStats.learning + stats.wordStats.new
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                return (
                  <div key={item.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: '#94a3b8' }}>{item.label}</span>
                      <span style={{ color: '#64748b' }}>{item.count} 个 ({pct}%)</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold mb-4" style={{ color: '#f1f5f9' }}>最近作文</h2>
          {!stats ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
            </div>
          ) : stats.recentEssays.length === 0 ? (
            <p className="text-sm" style={{ color: '#475569' }}>还没有提交过作文</p>
          ) : (
            <div className="space-y-3">
              {stats.recentEssays.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < stats.recentEssays.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                      {e.category === 'cet4' ? '四级' : e.category === 'cet6' ? '六级' : '考研'}作文
                    </div>
                    <div className="text-xs" style={{ color: '#475569' }}>
                      {new Date(e.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-xl font-extrabold" style={{
                    color: e.score != null ? (e.score >= 80 ? '#34d399' : e.score >= 60 ? '#fbbf24' : '#f87171') : '#475569'
                  }}>
                    {e.score ?? '--'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/quiz', title: '开始刷题', desc: '四六级 & 考研题库', icon: '📝', accent: '#8b5cf6' },
          { href: '/words', title: '背单词', desc: '核心词汇卡片记忆', icon: '📚', accent: '#22d3ee' },
          { href: '/essay', title: '写作文', desc: 'AI 即时批改评分', icon: '✍️', accent: '#34d399' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="glass card-hover rounded-2xl p-5 flex items-center gap-4"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30` }}>
              {item.icon}
            </div>
            <div>
              <div className="font-semibold" style={{ color: '#f1f5f9' }}>{item.title}</div>
              <div className="text-sm" style={{ color: '#64748b' }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [stats, setStats] = useState({ quiz: 0, accuracy: 0, words: 0, essays: 0 })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser({ id: user.id, email: user.email ?? '' })

      const [quizRes, wordRes, essayRes] = await Promise.all([
        supabase.from('quiz_records').select('is_correct').eq('user_id', user.id),
        supabase.from('word_records').select('status').eq('user_id', user.id),
        supabase.from('essays').select('id').eq('user_id', user.id),
      ])
      const quizRecords = quizRes.data ?? []
      const correct = quizRecords.filter(r => r.is_correct).length
      setStats({
        quiz: quizRecords.length,
        accuracy: quizRecords.length > 0 ? Math.round((correct / quizRecords.length) * 100) : 0,
        words: (wordRes.data ?? []).filter(w => w.status === 'known').length,
        essays: (essayRes.data ?? []).length,
      })
      setLoading(false)
    }
    load()
  }, [router])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('两次密码不一致'); return }
    if (newPassword.length < 6) { setPwError('密码至少6位'); return }
    setPwLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwError(error.message)
    } else {
      setPwMsg('密码修改成功')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPwLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  async function handleDeleteAccount() {
    const supabase = createClient()
    if (!user) return
    await Promise.all([
      supabase.from('quiz_records').delete().eq('user_id', user.id),
      supabase.from('word_records').delete().eq('user_id', user.id),
      supabase.from('essays').delete().eq('user_id', user.id),
    ])
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: '#475569' }}>加载中...</div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/dashboard')} className="text-sm" style={{ color: '#475569' }}>← 返回</button>
        <h1 className="text-2xl font-extrabold" style={{ color: '#f1f5f9' }}>个人信息</h1>
      </div>

      <div className="glass rounded-2xl p-6 mb-5" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff' }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: '#f1f5f9' }}>{user?.email}</div>
            <div className="text-sm mt-0.5" style={{ color: '#64748b' }}>已登录账号</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '做题数', value: stats.quiz, unit: '题', color: '#8b5cf6' },
            { label: '正确率', value: stats.accuracy, unit: '%', color: '#22d3ee' },
            { label: '掌握词', value: stats.words, unit: '个', color: '#34d399' },
            { label: '作文数', value: stats.essays, unit: '篇', color: '#f472b6' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>
                {s.value}<span className="text-xs font-normal ml-0.5" style={{ color: '#475569' }}>{s.unit}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 mb-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-bold mb-4" style={{ color: '#f1f5f9' }}>修改密码</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>新密码</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="至少6位" className="input-dark w-full px-4 py-3 rounded-xl text-sm" required />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>确认新密码</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码" className="input-dark w-full px-4 py-3 rounded-xl text-sm" required />
          </div>
          {pwError && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
              {pwError}
            </div>
          )}
          {pwMsg && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
              {pwMsg}
            </div>
          )}
          <button type="submit" disabled={pwLoading}
            className="btn-glow px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50">
            {pwLoading ? '修改中...' : '确认修改'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-bold mb-4" style={{ color: '#f1f5f9' }}>账号操作</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleLogout}
            className="glass px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
            退出登录
          </button>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              删除账号
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#f87171' }}>确认删除所有数据？</span>
              <button onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}>
                确认删除
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

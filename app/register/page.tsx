'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    await supabase.auth.signInWithPassword({ email, password })
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#0a0b0f' }}>
      <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center btn-glow">
              <span className="text-white font-bold relative z-10">英</span>
            </div>
            <span className="font-bold text-white text-xl">英语学习平台</span>
          </Link>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: '#f1f5f9' }}>创建账号</h1>
          <p style={{ color: '#64748b' }}>免费注册，开始你的备考之旅</p>
        </div>
        <div className="glass-strong rounded-2xl p-8" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>账号</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="输入邮箱账号" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>密码</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="至少6位" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>确认密码</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="再次输入密码" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="btn-glow w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:Claude Code-not-allowed">
              {loading ? '注册中...' : '免费注册'}
            </button>
          </form>
          <div className="mt-5 text-center text-sm" style={{ color: '#475569' }}>
            已有账号？{' '}
            <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#22d3ee' }}>
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

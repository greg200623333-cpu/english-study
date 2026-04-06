'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? '账号或密码错误' : error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#0a0b0f' }}>
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center btn-glow">
              <span className="text-white font-bold relative z-10">英</span>
            </div>
            <span className="font-bold text-white text-xl">英语学习平台</span>
          </Link>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: '#f1f5f9' }}>欢迎回来</h1>
          <p style={{ color: '#64748b' }}>登录账号，继续你的备考之旅</p>
        </div>
        <div className="glass-strong rounded-2xl p-8" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>账号</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="输入邮箱账号" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>密码</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="输入密码" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="btn-glow w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:Claude Code-not-allowed">
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <div className="mt-5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            </div>
            <div className="relative flex justify-center text-xs" style={{ color: '#475569' }}>
              <span className="px-3" style={{ background: '#0f1117' }}>或者</span>
            </div>
          </div>
          <Link href="/dashboard"
            className="mt-4 w-full flex justify-center py-3 rounded-xl text-sm font-medium glass transition-all"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
            游客体验（不保存进度）
          </Link>
          <div className="mt-5 text-center text-sm" style={{ color: '#475569' }}>
            还没有账号？{' '}
            <Link href="/register" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#a78bfa' }}>
              免费注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

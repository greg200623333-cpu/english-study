'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    const urlUsername = params.get('username')
    if (urlUsername) {
      return decodeURIComponent(urlUsername)
    }
    return localStorage.getItem('last_username') || ''
  })
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '登录失败')
        setLoading(false)
        return
      }

      // Save username to localStorage for future logins
      localStorage.setItem('last_username', username)

      /**
       * AI辅助调试：DeepSeek-Coder，2026-04-10
       * 用途：标记需要检查用户切换（预留标志，当前未使用，待未来集成）
       * 采纳率：约10%（参考了状态数据穿透的排查思路）
       */
      // 标记需要检查用户切换
      sessionStorage.setItem('force-reset-store', 'true')
      router.push('/dashboard')
    } catch (err) {
      setError('网络错误，请重试')
      setLoading(false)
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
            <span className="font-bold text-white text-xl">战略英语 WarRoom English</span>
          </Link>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: '#f1f5f9' }}>欢迎回来</h1>
          <p style={{ color: '#64748b' }}>登录账号，继续你的备考之旅</p>
        </div>

        <div className="glass-strong rounded-2xl p-8" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>账号</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="输入账号"
                className="input-dark w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>密码</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="输入密码"
                className="input-dark w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-cyan-400"
              />
              <label htmlFor="rememberMe" className="text-sm cursor-pointer" style={{ color: '#94a3b8' }}>15天免密登录</label>
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="btn-glow w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
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

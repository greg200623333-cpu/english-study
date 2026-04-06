'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: '控制台', icon: '⬡', mobileIcon: '🏠', tag: 'HOME' },
  { href: '/quiz', label: '刷题练习', icon: '◈', mobileIcon: '📝', tag: 'QUIZ' },
  { href: '/words', label: '单词学习', icon: '◉', mobileIcon: '📚', tag: 'VOCAB' },
  { href: '/essay', label: 'AI 作文', icon: '◎', mobileIcon: '✍️', tag: 'ESSAY' },
  { href: '/profile', label: '个人信息', icon: '◷', mobileIcon: '👤', tag: 'ME' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex grid-bg" style={{ background: '#0a0b0f' }}>

      <aside className="hidden md:flex w-60 flex-col fixed h-full z-20 glass"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center btn-glow">
              <span className="text-white font-bold text-sm relative z-10">英</span>
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight">英语学习平台</div>
              <div className="text-xs" style={{ color: '#475569' }}>CET-4/6 · 考研</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative"
                style={{
                  background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  color: active ? '#a78bfa' : '#64748b',
                }}>
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                    style={{ background: 'linear-gradient(180deg, #8b5cf6, #22d3ee)' }} />
                )}
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-bold opacity-50"
                  style={{ color: active ? '#a78bfa' : '#475569', background: 'rgba(255,255,255,0.05)' }}>
                  {item.tag}
                </span>
              </Link>
            )
          })}
        </nav>
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: '#475569', border: '1px solid transparent' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#f87171'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.2)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#475569'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
            }}>
            <span>⏻</span>退出登录
          </button>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 z-20 glass flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center btn-glow">
            <span className="text-white font-bold text-xs relative z-10">英</span>
          </div>
          <span className="font-bold text-white text-sm">英语学习平台</span>
        </Link>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: '#475569', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          退出
        </button>
      </header>

      <main className="flex-1 md:ml-60 pt-16 md:pt-0 pb-20 md:pb-0 p-4 md:p-8 min-h-screen w-full">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 glass flex items-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
              style={{ color: active ? '#a78bfa' : '#475569' }}>
              <span className="text-xl leading-none">{item.mobileIcon}</span>
              <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              {active && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)' }} />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}


'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { StrategicFab } from '@/components/study-mode/StrategicFab'
import { NoticeModal } from '@/components/NoticeModal'
import { useStudyModeStore } from '@/stores/useStudyModeStore'

const navItems = [
  { href: '/dashboard', label: '最高指挥部', icon: '◈', mobileIcon: '🛰', tag: 'HQ' },
  { href: '/quiz', label: '作战部署台', icon: '◉', mobileIcon: '⚔', tag: 'OPS' },
  { href: '/words', label: '词汇财政部', icon: '◍', mobileIcon: '📚', tag: 'GDP' },
  { href: '/essay', label: '政策输出部', icon: '◎', mobileIcon: '✍', tag: 'WRITE' },
  { href: '/ssa', label: '战略勤务局', icon: '◬', mobileIcon: '🎯', tag: 'SSA' },
  { href: '/profile', label: '指挥官档案', icon: '◇', mobileIcon: '👤', tag: 'ME' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isSsa = pathname === '/ssa'
  const resetForUserSwitch = useStudyModeStore((state) => state.resetForUserSwitch)
  const openNotice = useStudyModeStore((state) => state.openNotice)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStorage.getItem('hasSeenUpdateNotice_v1') !== 'true') {
        openNotice()
        localStorage.setItem('hasSeenUpdateNotice_v1', 'true')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [openNotice])

  async function handleLogout() {
    resetForUserSwitch()
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div className="min-h-screen flex grid-bg" style={{ background: '#0a0b0f' }}>
      <NoticeModal />
      <aside className="glass fixed z-20 hidden h-full w-64 flex-col md:flex" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="btn-glow flex h-10 w-10 items-center justify-center rounded-xl">
              <span className="relative z-10 text-sm font-bold text-white">英</span>
            </div>
            <div>
              <div className="text-sm font-bold leading-tight text-white">大战略备考指挥部</div>
              <div className="text-xs" style={{ color: '#475569' }}>CET-4 / CET-6 / 考研英语</div>
            </div>
          </Link>
        </div>

        <nav className="mt-2 flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(34,211,238,0.28)' : '1px solid transparent',
                  color: active ? '#67e8f9' : '#64748b',
                }}
              >
                {active ? <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-cyan-300" /> : null}
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs font-bold opacity-60">{item.tag}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={openNotice}
            className="mb-2 flex w-full items-center gap-2 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-2.5 text-left text-sm font-medium text-indigo-300 transition hover:border-indigo-400/40 hover:bg-indigo-500/18"
          >
            <span className="animate-pulse text-base">📡</span>
            <span>系统简报</span>
          </button>
          <button onClick={handleLogout} className="w-full rounded-xl border border-white/10 px-3 py-3 text-left text-sm font-medium text-slate-400 transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300">
            退出指挥部
          </button>
        </div>
      </aside>

      <header className="glass fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-3 md:hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="btn-glow flex h-8 w-8 items-center justify-center rounded-xl">
            <span className="relative z-10 text-xs font-bold text-white">英</span>
          </div>
          <span className="text-sm font-bold text-white">大战略备考</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={openNotice}
            className="flex items-center gap-1 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-300"
          >
            <span className="animate-pulse">📡</span>
            <span>简报</span>
          </button>
          <button onClick={handleLogout} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400">退出</button>
        </div>
      </header>

      <main className={isSsa ? 'min-h-screen w-full flex-1 pb-20 pt-16 md:ml-64 md:pb-0 md:pt-0' : 'min-h-screen w-full flex-1 p-4 pb-24 pt-16 md:ml-64 md:p-8 md:pt-8'}>{children}</main>
      <StrategicFab />

      <nav className="glass fixed bottom-0 left-0 right-0 z-20 flex items-center md:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-all" style={{ color: active ? '#67e8f9' : '#475569' }}>
              <span className="text-xl leading-none">{item.mobileIcon}</span>
              <span className="text-[10px] font-medium leading-tight">{item.label.slice(0, 4)}</span>
              {active ? <div className="absolute bottom-0 h-0.5 w-8 rounded-full bg-cyan-300" /> : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

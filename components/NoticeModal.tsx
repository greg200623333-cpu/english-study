'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useStudyModeStore } from '@/stores/useStudyModeStore'

export function NoticeModal() {
  const isNoticeOpen = useStudyModeStore((state) => state.isNoticeOpen)
  const closeNotice = useStudyModeStore((state) => state.closeNotice)

  return (
    <AnimatePresence>
      {isNoticeOpen && (
        <motion.div
          key="notice-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeNotice() }}
        >
          <motion.div
            key="notice-card"
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.35, ease: [0.2, 1, 0.32, 1] }}
            className="relative w-full max-w-2xl rounded-[2rem] border border-indigo-500/30 bg-slate-900 shadow-[0_0_80px_rgba(99,102,241,0.18),0_0_0_1px_rgba(99,102,241,0.12)]"
          >
            {/* 顶部光晕 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-[2rem] bg-[linear-gradient(to_bottom,rgba(99,102,241,0.18),transparent)]" />

            {/* 标题区 */}
            <div className="relative border-b border-indigo-500/20 px-8 py-6">
              <div className="text-[10px] uppercase tracking-[0.4em] text-indigo-400/80">System Broadcast</div>
              <h2 className="mt-2 text-xl font-black text-slate-50">📡 最高指挥部：系统架构升级简报</h2>
            </div>

            {/* 内容区（可滚动） */}
            <div className="max-h-[60vh] overflow-y-auto px-8 py-6 text-sm leading-7 text-slate-300" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.4) transparent' }}>
              <div className="space-y-5">
                <div className="rounded-[1.25rem] border border-indigo-500/20 bg-indigo-500/10 p-5">
                  <div className="text-xs uppercase tracking-[0.3em] text-indigo-300/80">v2.0 · 核心架构升级</div>
                  <ul className="mt-3 space-y-2 text-slate-200">
                    <li>◈ <span className="font-semibold text-indigo-200">SSA 间隔重复系统 (SRS)</span> — 全面接入 FSRS 算法，词汇复习间隔由稳定性与难度动态计算，告别机械循环。</li>
                    <li>◈ <span className="font-semibold text-indigo-200">词汇 GDP 财政体系</span> — 每次占领词汇均产生 GDP 收益，法案 Buff 加成实时推演，战略价值可量化。</li>
                    <li>◈ <span className="font-semibold text-indigo-200">赤字治理机制</span> — 积压复习词汇自动计入财政赤字，赤字冻结协议可集中清算。</li>
                  </ul>
                </div>

                <div className="rounded-[1.25rem] border border-cyan-500/20 bg-cyan-500/10 p-5">
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">v2.1 · 战略情报升级</div>
                  <ul className="mt-3 space-y-2 text-slate-200">
                    <li>◉ <span className="font-semibold text-cyan-200">每日目标动态计算</span> — 预计完成天数现已纳入待复习词数，精准反映实际作战负荷。</li>
                    <li>◉ <span className="font-semibold text-cyan-200">词书切换隔离</span> — 切换战略方向后，GDP 与赤字数据完整隔离，不同词书互不干扰。</li>
                    <li>◉ <span className="font-semibold text-cyan-200">战略勤务局 (SSA) 全面重构</span> — 词卡 3D 翻转动效、粒子爆破、实时战报流，沉浸式作战体验。</li>
                  </ul>
                </div>

                <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">v2.2 · 法案系统</div>
                  <ul className="mt-3 space-y-2 text-slate-200">
                    <li>◍ <span className="font-semibold text-emerald-200">强制晨读法案</span> — 激活后全天记忆率 +15%，适合高强度冲刺阶段。</li>
                    <li>◍ <span className="font-semibold text-emerald-200">赤字冻结协议</span> — 复习效率 +18%，集中清算积压任务的最优解。</li>
                    <li>◍ <span className="font-semibold text-emerald-200">定向预算增发</span> — GDP 产出 +10%，高频词汇优先投入策略。</li>
                  </ul>
                </div>

                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5 text-slate-400">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">指挥官须知</div>
                  <p className="mt-3">本次升级为破坏性更新，旧版本数据已完整迁移。如遇数据异常，请在指挥官档案页重新选择战略方向以触发重新初始化。</p>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="border-t border-indigo-500/20 px-8 py-5">
              <button
                onClick={closeNotice}
                className="w-full rounded-xl border border-indigo-400/40 bg-indigo-500/20 py-3 text-sm font-bold text-indigo-100 shadow-[0_0_24px_rgba(99,102,241,0.25)] transition hover:bg-indigo-500/30 hover:shadow-[0_0_32px_rgba(99,102,241,0.35)]"
              >
                确认查阅 · 返回作战
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

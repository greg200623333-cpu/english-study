'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStudyModeStore } from '@/stores/useStudyModeStore'

// ─── 小工具组件 ─────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-flex items-center rounded-md border border-cyan-400/40 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.08)] md:px-2 md:text-xs">
      {children}
    </kbd>
  )
}

function Hi({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-cyan-400">{children}</span>
}

function SectionTitle({ children, color = 'border-cyan-400' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className={`border-l-4 ${color} pl-3 md:pl-4`}>
      <div className="text-sm font-black text-slate-100 md:text-base">{children}</div>
    </div>
  )
}

function RatingRow({ grade, time, desc, color }: { grade: string; time: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/6 bg-slate-950/50 px-3 py-2 md:gap-3 md:px-4 md:py-3">
      <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black md:px-2 md:text-xs ${color}`}>{grade}</span>
      <div className="text-xs leading-5 text-slate-300 md:text-sm md:leading-6">
        <span className="font-semibold text-slate-100">{time}</span> — {desc}
      </div>
    </div>
  )
}

// ─── Tab A ──────────────────────────────────────────────────────

function TabA() {
  return (
    <div className="space-y-3 text-xs leading-5 text-slate-300 md:space-y-5 md:text-sm md:leading-7">
      <p className="hidden md:block">
        在这里，CET-4、CET-6 或考研英语的备考被具象化为一场国家级战略演练。你的词汇量是"国家 <Hi>GDP</Hi>"，你的复习任务是"财政<Hi>赤字</Hi>"，而你的学习精力则是"<Hi>行政力</Hi>"。
      </p>
      <p className="md:hidden">
        词汇量 = <Hi>GDP</Hi>，复习任务 = <Hi>赤字</Hi>，学习精力 = <Hi>行政力</Hi>。
      </p>

      <div className="space-y-2 md:space-y-3">
        <SectionTitle color="border-cyan-400">1. 任务调度</SectionTitle>
        <p className="hidden md:block">系统每日为你分配的 <Hi>20 个配额</Hi>（随法案动态调整）不是随机抽取的。</p>
        <p className="md:hidden">每日 <Hi>20 配额</Hi>按优先级分配：</p>
        <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-2.5 md:space-y-2 md:p-4">
          {[
            { tag: 'Reinforce', tagColor: 'border-amber-400/30 bg-amber-400/10 text-amber-300', title: '复习优先', desc: '已到期词汇排最前。', descFull: '系统优先扫描数据库，将所有已到期的词汇排在最前。' },
            { tag: 'Scout', tagColor: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300', title: '新词补位', desc: '赤字清空后分配新词。', descFull: '只有当赤字清空后，剩余名额才会分配给新词。' },
            { tag: 'Resume', tagColor: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300', title: '断点续传', desc: '进度不丢失。', descFull: '战局随时可停。关闭页面后再次进入，系统会基于当前时间戳重新计算最紧急的词汇并热启动。' },
          ].map((item) => (
            <div key={item.tag} className="flex items-start gap-2 md:gap-3">
              <span className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider md:px-2 md:text-[10px] ${item.tagColor}`}>{item.tag}</span>
              <p className="md:hidden"><span className="font-semibold text-slate-100">{item.title}</span>：{item.desc}</p>
              <p className="hidden md:block"><span className="font-semibold text-slate-100">{item.title}</span>：{item.descFull}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <SectionTitle color="border-fuchsia-400">2. 反应时驱动判定</SectionTitle>
        <p className="hidden md:block">你的记忆表现由<Hi>肌肉记忆与反射速度</Hi>决定：</p>
        <p className="md:hidden">记忆表现由<Hi>反射速度</Hi>决定：</p>
        <div className="space-y-1 md:space-y-1.5">
          <div className="rounded-lg border border-white/6 bg-slate-950/50 px-2.5 py-2 text-xs md:px-4 md:py-3 md:text-sm">
            <Kbd>Space</Kbd> <span className="font-semibold text-slate-100">停止计时</span>：<span className="md:hidden">根据耗时评级。</span><span className="hidden md:inline">按下空格键翻看释义，系统根据耗时给出战术评级。</span>
          </div>
          <div className="space-y-1 pl-1 md:space-y-1.5 md:pl-2">
            <RatingRow grade="Perfect" time="&lt; 1.2s" desc="稳定性 4× 增长。" color="bg-emerald-500/15 text-emerald-300" />
            <RatingRow grade="Good" time="1.2s – 3s" desc="稳定性翻倍。" color="bg-cyan-500/15 text-cyan-300" />
            <RatingRow grade="Hard" time="3s – 5s" desc="小幅增长。" color="bg-amber-500/15 text-amber-300" />
            <RatingRow grade="Forgot" time="&gt; 5s" desc="重新入队。" color="bg-rose-500/15 text-rose-300" />
          </div>
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <SectionTitle color="border-amber-400">3. 资产沉淀</SectionTitle>
        <div className="space-y-1.5 md:space-y-2">
          <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-2 text-xs md:px-4 md:py-3 md:text-sm">
            <span className="font-semibold text-emerald-300">词汇毕业</span>：<span className="hidden md:inline">当一个单词的稳定性达到 <Hi>365 天</Hi>，它将转化为你的"永久资产"。</span><span className="md:hidden">稳定性达 <Hi>365 天</Hi> 转为永久资产。</span>
          </div>
          <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.07] px-3 py-2 text-xs md:px-4 md:py-3 md:text-sm">
            <span className="font-semibold text-amber-300">政策输出</span>：<span className="hidden md:inline">消耗"<Hi>行政力</Hi>"，颁布"强制晨读法案"等政策，为全局状态叠加 Buff。</span><span className="md:hidden">消耗 <Hi>行政力</Hi> 颁布政策。</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab B ──────────────────────────────────────────────────────

function TabB() {
  return (
    <div className="space-y-3 text-xs leading-5 text-slate-300 md:space-y-5 md:text-sm md:leading-7">
      <p className="hidden md:block">
        如果你是计算机或建筑学专业的学生，专业模式将为你提供"<Hi>知行合一</Hi>"的终极解法。我们将英语阅读理解直接转化为程序逻辑梳理与具象化视觉展现。
      </p>
      <p className="md:hidden">
        专业模式：将英语阅读转化为<Hi>程序逻辑</Hi>与<Hi>视觉展现</Hi>。
      </p>

      <div className="space-y-2 md:space-y-3">
        <SectionTitle color="border-violet-400">计算机专业 — 算法沉浸阅读</SectionTitle>
        <p className="hidden md:block">针对全英文算法题干（如 LeetCode 原题）与开源代码的解析引擎。</p>
        <div className="space-y-1.5 md:space-y-2">
          {[
            { title: '解剖式阅读', desc: '高亮关键短语。', descFull: '左侧为全英文题目区。系统自动识别并高亮表示数据结构和算法逻辑的关键短语。' },
            { title: '源码级对照', desc: 'Monaco Editor 代码参考。', descFull: '右侧嵌入原生 Monaco Editor，提供 C 语言等代码的参考实现。' },
            { title: 'AI 动态 Demo', desc: '划词生成 C 语言 Demo。', descFull: '遇到不懂的专业词汇，直接划词选中。AI 不仅给出精准的编程语境中文释义，还会在悬浮窗内动态生成对应的 C 语言 Demo。' },
            { title: '终端极客测验', desc: '纯英文指令测验。', descFull: '界面底部集成终端。系统抛出纯英文指令，你必须在终端敲入正确答案以获得编译成功的绿色反馈。' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-violet-400/15 bg-violet-400/[0.07] px-3 py-2 md:px-4 md:py-3">
              <span className="font-semibold text-violet-300">{item.title}</span>：<span className="md:hidden">{item.desc}</span><span className="hidden md:inline">{item.descFull}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <SectionTitle color="border-rose-400">建筑学专业 — AI 视觉意境词典</SectionTitle>
        <p className="hidden md:block">打破传统建筑术语的死记硬背，将抽象词汇瞬间转化为具象的视觉艺术。</p>
        <div className="space-y-1.5 md:space-y-2">
          <div className="rounded-lg border border-rose-400/15 bg-rose-400/[0.07] px-3 py-2 md:px-4 md:py-3">
            <span className="font-semibold text-rose-300">AI 生成建筑意境图</span>：<span className="hidden md:inline">输入 "Gothic Revival"，AI 瞬间生成哥特复兴风格的建筑渲染图。</span><span className="md:hidden">输入术语，AI 生成建筑渲染图。</span>
          </div>
          <div className="rounded-lg border border-rose-400/15 bg-rose-400/[0.07] px-3 py-2 md:px-4 md:py-3">
            <span className="font-semibold text-rose-300">视觉记忆锚点</span>：<span className="hidden md:inline">每个专业词汇都配有高清建筑实景图，形成强烈的视觉记忆锚点。</span><span className="md:hidden">专业词汇配高清实景图。</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 主组件 ─────────────────────────────────────────────────────

export function SystemBriefingModal() {
  const { isBriefingOpen, closeBriefing } = useStudyModeStore()
  const [activeTab, setActiveTab] = useState<'strategy' | 'geek'>('strategy')

  return (
    <AnimatePresence>
      {isBriefingOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md md:p-6"
          onClick={closeBriefing}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
              maxHeight: '85vh',
            }}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-white/10 px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80 md:text-xs">System Briefing</p>
                  <h2 className="mt-0.5 text-lg font-black text-slate-50 md:mt-1 md:text-2xl">战略简报</h2>
                </div>
                <button
                  onClick={closeBriefing}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:bg-white/5 hover:text-slate-200 md:h-10 md:w-10"
                  aria-label="关闭"
                >
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tab Switcher - 横排紧凑 */}
            <div className="shrink-0 flex gap-2 border-b border-white/10 px-4 py-2 md:gap-3 md:px-6 md:py-3">
              <button
                onClick={() => setActiveTab('strategy')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition md:gap-2 md:px-4 md:py-2.5 md:text-sm ${
                  activeTab === 'strategy'
                    ? 'border border-cyan-400/30 bg-cyan-400/15 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="hidden sm:inline">大战略备考指挥部</span>
                <span className="sm:hidden">战略模式</span>
              </button>
              <button
                onClick={() => setActiveTab('geek')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition md:gap-2 md:px-4 md:py-2.5 md:text-sm ${
                  activeTab === 'geek'
                    ? 'border border-violet-400/30 bg-violet-400/15 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                    : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="hidden sm:inline">沉浸式极客工作台</span>
                <span className="sm:hidden">专业模式</span>
              </button>
            </div>

            {/* Content - 自定义滚动条 */}
            <div
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-32 md:px-6 md:py-6 md:pb-36"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                  background: rgba(148, 163, 184, 0.3);
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: rgba(148, 163, 184, 0.5);
                }
              `}</style>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'strategy' ? <TabA /> : <TabB />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky Footer - 单一部署按钮 */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-transparent px-4 py-3 backdrop-blur-xl md:px-6 md:py-4">
              <p className="mb-3 hidden text-xs leading-5 text-slate-400 md:block">
                指令确认：词汇体系已部署，请规划每日 <span className="text-cyan-400">GDP</span> 目标，关注<span className="text-rose-400">赤字</span>预警。
              </p>
              <button
                type="button"
                onClick={closeBriefing}
                className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] md:py-4 md:text-base"
                style={{
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.9), rgba(99,102,241,0.9))',
                  boxShadow: '0 0 30px rgba(34,211,238,0.4), 0 8px 16px rgba(0,0,0,0.3)',
                }}
              >
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 transition group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  确认，立即开始部署
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

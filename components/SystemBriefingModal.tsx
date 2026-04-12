'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStudyModeStore } from '@/stores/useStudyModeStore'

// ─── 小工具组件 ─────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-flex items-center rounded-md border border-cyan-400/40 bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]">
      {children}
    </kbd>
  )
}

function Hi({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-cyan-400">{children}</span>
}

function SectionTitle({ children, color = 'border-cyan-400' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className={`border-l-4 ${color} pl-4`}>
      <div className="text-base font-black text-slate-100">{children}</div>
    </div>
  )
}

function RatingRow({ grade, time, desc, color }: { grade: string; time: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-slate-950/50 px-4 py-3">
      <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-black ${color}`}>{grade}</span>
      <div className="text-sm leading-6 text-slate-300">
        <span className="font-semibold text-slate-100">{time}</span> — {desc}
      </div>
    </div>
  )
}

// ─── Tab A ──────────────────────────────────────────────────────

function TabA() {
  return (
    <div className="space-y-7 text-sm leading-7 text-slate-300">
      <p>
        在这里，CET-4、CET-6 或考研英语的备考被具象化为一场国家级战略演练。你的词汇量是"国家 <Hi>GDP</Hi>"，你的复习任务是"财政<Hi>赤字</Hi>"，而你的学习精力则是"<Hi>行政力</Hi>"。
      </p>

      <div className="space-y-3">
        <SectionTitle color="border-cyan-400">1. 任务调度：先修补阵地，再扩张领土</SectionTitle>
        <p>系统每日为你分配的 <Hi>20 个配额</Hi>（随法案动态调整）不是随机抽取的。</p>
        <div className="space-y-2 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
          {[
            { tag: 'Reinforce', tagColor: 'border-amber-400/30 bg-amber-400/10 text-amber-300', title: '复习优先', desc: '系统优先扫描数据库，将所有已到期的词汇排在最前。这是你必须清偿的"债务"。' },
            { tag: 'Scout', tagColor: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300', title: '新词补位', desc: '只有当赤字清空后，剩余名额才会分配给新词。' },
            { tag: 'Resume', tagColor: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300', title: '断点续传', desc: '战局随时可停。关闭页面后再次进入，系统会基于当前时间戳重新计算最紧急的词汇并热启动，进度绝不丢失。' },
          ].map((item) => (
            <div key={item.tag} className="flex items-start gap-3">
              <span className={`mt-1 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.tagColor}`}>{item.tag}</span>
              <p><span className="font-semibold text-slate-100">{item.title}</span>：{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle color="border-fuchsia-400">2. 反应时驱动判定（Auto-Grading）</SectionTitle>
        <p>放下鼠标，把双手放在键盘上。你的记忆表现不是主观评定的，而是由<Hi>肌肉记忆与反射速度</Hi>决定的：</p>
        <div className="space-y-2">
          <div className="rounded-xl border border-white/6 bg-slate-950/50 px-4 py-3">
            <span className="font-semibold text-slate-100">看词 → 脑内搜索</span>：单词出现的瞬间，后台毫秒级计时器启动。
          </div>
          <div className="rounded-xl border border-white/6 bg-slate-950/50 px-4 py-3">
            <Kbd>Space</Kbd> <span className="font-semibold text-slate-100">停止计时</span>：按下空格键翻看释义，系统根据耗时给出战术评级：
          </div>
          <div className="space-y-1.5 pl-2">
            <RatingRow grade="Perfect" time="&lt; 1.2s" desc="条件反射，记忆稳定性获得 4× 暴击增长。" color="bg-emerald-500/15 text-emerald-300" />
            <RatingRow grade="Good" time="1.2s – 3s" desc="正常回想，稳定性翻倍。" color="bg-cyan-500/15 text-cyan-300" />
            <RatingRow grade="Hard" time="3s – 5s" desc="勉强想起，稳定性仅小幅增长。" color="bg-amber-500/15 text-amber-300" />
            <RatingRow grade="Forgot" time="&gt; 5s" desc="判定为「战损」，该词立即被重新塞回今日队列末尾。" color="bg-rose-500/15 text-rose-300" />
          </div>
          <div className="rounded-xl border border-white/6 bg-slate-950/50 px-4 py-3">
            <Kbd>Enter</Kbd> / <Kbd>J</Kbd> <span className="font-semibold text-slate-100">确认击杀</span>：确认占领该词，滑出进入下一张卡片。
          </div>
          <div className="rounded-xl border border-white/6 bg-slate-950/50 px-4 py-3">
            <Kbd>K</Kbd> <span className="font-semibold text-slate-100">手动调级</span>：如果你觉得系统判定过高，按 K 强制标记为 Hard，主动缩短下次复习间隔。
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle color="border-amber-400">3. 资产沉淀与政策干预</SectionTitle>
        <div className="space-y-2">
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-3">
            <span className="font-semibold text-emerald-300">词汇毕业</span>：当一个单词的稳定性达到 <Hi>365 天</Hi>，它将转化为你的"永久资产"，永久移出日常拉练队列。
          </div>
          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.07] px-4 py-3">
            <span className="font-semibold text-amber-300">政策输出部</span>：消耗学习积累的"<Hi>行政力</Hi>"，颁布"强制晨读法案"或"赤字冻结协议"等政策，为全局状态叠加 Buff。
          </div>
          <div className="rounded-xl border border-indigo-400/15 bg-indigo-400/[0.07] px-4 py-3">
            <span className="font-semibold text-indigo-300">双层持久化防护</span>：每一次击键都会实时同步至本地缓存，每 10 个词异步提交至云端数据库。即使断网，你的"战损"与"战果·"也坚如磐石。
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab B ──────────────────────────────────────────────────────

function TabB() {
  return (
    <div className="space-y-7 text-sm leading-7 text-slate-300">
      <p>
        如果你是计算机或建筑学专业的学生，专业模式将为你提供"<Hi>知行合一</Hi>"的终极解法。我们将英语阅读理解直接转化为程序逻辑梳理与具象化视觉展现。
      </p>

      <div className="space-y-3">
        <SectionTitle color="border-violet-400">模块一：计算机专业 — 算法沉浸阅读</SectionTitle>
        <p>针对全英文算法题干（如 LeetCode 原题）与开源代码的解析引擎。</p>
        <div className="space-y-2">
          {[
            { title: '解剖式阅读', desc: '左侧为全英文题目区。系统自动识别并高亮表示数据结构和算法逻辑的关键短语（如 contiguous subarray）。', color: 'border-violet-400/15 bg-violet-400/[0.07]', titleColor: 'text-violet-300' },
            { title: '源码级对照', desc: '右侧嵌入原生 Monaco Editor，提供 C 语言等代码的参考实现。边看英文题干，边对照底层逻辑。', color: 'border-violet-400/15 bg-violet-400/[0.07]', titleColor: 'text-violet-300' },
            { title: 'AI 动态 Demo', desc: '遇到不懂的专业词汇，直接划词选中。AI 不仅给出精准的编程语境中文释义，还会在悬浮窗内动态生成对应的 C 语言 Demo。', color: 'border-violet-400/15 bg-violet-400/[0.07]', titleColor: 'text-violet-300' },
            { title: '终端极客测验', desc: '界面底部集成终端。系统抛出纯英文指令，你必须在终端敲入正确答案以获得编译成功的绿色反馈。', color: 'border-violet-400/15 bg-violet-400/[0.07]', titleColor: 'text-violet-300' },
          ].map((item) => (
            <div key={item.title} className={`rounded-xl border px-4 py-3 ${item.color}`}>
              <span className={`font-semibold ${item.titleColor}`}>{item.title}</span>：{item.desc}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle color="border-rose-400">模块二：建筑学专业 — AI 视觉意境词典</SectionTitle>
        <p>打破传统建筑术语的死记硬背，将抽象词汇瞬间转化为具象的视觉艺术。</p>
        <div className="space-y-2">
          <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.07] px-4 py-3">
            <span className="font-semibold text-rose-300">专业术语库</span>：左侧导航栏列出核心建筑专业词汇（如 <Hi>Flying Buttress</Hi>、<Hi>Oculus</Hi>）。
          </div>
          <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.07] px-4 py-3">
            <span className="font-semibold text-rose-300">AIGC 驱动展示</span>：点击任意术语，系统立即调用大模型，在右侧渲染一张极具真实感、符合该建筑流派特征的高清照片。<Hi>所学即所见</Hi>。
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 注册表（必须在 TabA / TabB 之后） ──────────────────────

const TABS = [
  { id: 'a' as const, label: '🎖️ 大战略备考指挥部', Component: TabA },
  { id: 'b' as const, label: '💻 沉浸式极客工作台', Component: TabB },
]

// ─── 主弹窗 ─────────────────────────────────────────────────────

export function SystemBriefingModal() {
  const isBriefingOpen = useStudyModeStore((state) => state.isBriefingOpen)
  const closeBriefing = useStudyModeStore((state) => state.closeBriefing)
  const [activeTab, setActiveTab] = useState<'a' | 'b'>('a')
  const [direction, setDirection] = useState(1)

  function switchTab(id: 'a' | 'b') {
    if (id === activeTab) return
    setDirection(id === 'b' ? 1 : -1)
    setActiveTab(id)
  }

  const ActiveComponent = TABS.find((t) => t.id === activeTab)!.Component

  return (
    <AnimatePresence>
      {isBriefingOpen && (
        <motion.div
          key="briefing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/80 backdrop-blur-md sm:items-center sm:px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeBriefing() }}
        >
          <motion.div
            key="briefing-card"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.38, ease: [0.2, 1, 0.32, 1] }}
            className="relative flex w-full max-w-3xl flex-col rounded-t-[2rem] border border-cyan-400/20 bg-slate-900 shadow-[0_0_100px_rgba(34,211,238,0.12),0_0_0_1px_rgba(34,211,238,0.08)] sm:rounded-[2rem]"
            style={{ height: 'calc(100dvh - env(safe-area-inset-top, 0px) - 56px)', maxHeight: '92dvh' }}
          >
            {/* 顶部光晕 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-[2rem] bg-[linear-gradient(to_bottom,rgba(34,211,238,0.14),transparent)]" />

            {/* ── Header ── */}
            <div className="relative shrink-0 border-b border-white/8 px-5 py-4 md:px-8 md:py-6">
              <div className="text-[10px] uppercase tracking-[0.45em] text-cyan-300/70">System Broadcast · v2.0</div>
              <h2 className="mt-1.5 text-base font-black leading-snug text-slate-50 md:mt-2 md:text-xl">
                🚀 全新架构升级：将英语学习重塑为大战略与沉浸式极客实验
              </h2>
              {/* 描述段落：移动端隐藏，节省空间 */}
              <p className="mt-3 hidden text-sm leading-7 text-slate-400 md:block">
                <span className="font-semibold text-slate-300">各位指挥官与开发者，欢迎来到全新升级的英语学习平台。</span>打破传统背单词软件"打卡签到"的枯燥套路与"死记硬背"的低效泥潭。现在，这里不再是一个简单的词典或题库，而是一个结合了
                <span className="font-semibold text-cyan-400">宏观资源调度</span>与
                <span className="font-semibold text-cyan-400">源码级硬核交互</span>的综合工作站。本网站为两大核心板块：<span className="font-semibold text-cyan-400">大战略学习模式</span>与<span className="font-semibold text-cyan-400">沉浸式专业模式</span>。以下是详细的系统运转逻辑与操作指南。
              </p>

              {/* ── Tabs 头部 ── */}
              <div className="mt-4 flex gap-1 overflow-x-auto border-b border-white/8 md:mt-5" style={{ scrollbarWidth: 'none' }}>
                {TABS.map((tab) => {
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => switchTab(tab.id)}
                      className={`relative shrink-0 pb-3 pr-4 text-xs font-semibold transition-colors sm:pr-6 sm:text-sm ${active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {tab.label}
                      {active && (
                        <motion.div
                          layoutId="briefing-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Tab 内容区（可滚动） ── */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeTab}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -32 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                  className="absolute inset-0 overflow-y-auto px-5 py-5 md:px-8 md:py-6"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.3) transparent' }}
                >
                  <ActiveComponent />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div className="relative shrink-0 border-t border-white/8 px-5 py-4 md:px-8 md:py-5">
              <p className="mb-4 hidden text-xs leading-6 text-slate-500 md:block">
                <span className="font-semibold text-slate-400">最高指挥部提示：</span>
                无论是建立你的词汇帝国，还是在极客工作台手撕英文源码，所有的工具都已部署完毕。请合理规划你的每日{' '}
                <span className="text-cyan-400">GDP</span> 目标，关注
                <span className="text-rose-400">赤字</span>预警。祝武运昌隆。进入系统，开始你的战略部署。
              </p>
              <button
                type="button"
                onClick={closeBriefing}
                className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.18))',
                  border: '1px solid rgba(34,211,238,0.35)',
                  boxShadow: '0 0 24px rgba(34,211,238,0.2)',
                }}
              >
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.25) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                <span className="relative z-10">确认，开始部署</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

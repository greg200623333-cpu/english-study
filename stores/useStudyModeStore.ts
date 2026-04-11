'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ExamType = 'cet4' | 'cet6' | 'kaoyan'
export type WordTier = 'core' | 'full'

export type WordAsset = {
  id: number
  word: string
  category: string
  tier: WordTier
  difficultyWeight: number
  masteryLevel: number
  status: 'new' | 'learning' | 'known'
}

export type LawKey = 'morningReading' | 'deficitFreeze' | 'nightReview' | 'focusBudget'

export type LawDefinition = {
  key: LawKey
  name: string
  description: string
  cost: number
  buffKey: 'memoryRate' | 'reviewEfficiency' | 'focusRate' | 'gdpBonus'
  buffValue: number
}

export type LawState = Record<LawKey, boolean>

export type ActiveBuffs = {
  memoryRate: number
  reviewEfficiency: number
  focusRate: number
  gdpBonus: number
}

export type GdpHistoryPoint = {
  label: string
  value: number
}

export type StudyModeSnapshot = {
  hasSeenBriefing: boolean
  selectedExam: ExamType | null
  selectedWordTier: WordTier
  hasChosenWordTier: boolean
  examLabel: string
  daysToExam: number
  administrativePower: number
  baseAdministrativePower: number
  baseAssets: number
  sessionGains: number
  lastSessionGain: number
  hasSsaExchange: boolean
  comboCount: number
  dailyOpsCompleted: boolean
  ssaGdpBonus: number
  vocabularyGDP: number
  baselineWpm: number
  skillBalance: {
    listening: number
    speaking: number
    reading: number
    writing: number
  }
  reviewDeficit: number
  laws: LawState
  activeBuffs: ActiveBuffs
  gdpHistory: GdpHistoryPoint[]
  ssaLoadedCount: number
  ssaHasMore: boolean
  ssaMountRequired: boolean
  pendingDeficitNotice: string | null
  hasSeenFirstDeficitNotice: boolean
  lastBriefingAt: string | null
  dailyWordTarget: number
}

type ExamProfile = {
  label: string
  daysToExam: number
  initialGDP: number
  administrativePower: number
  baselineWpm: number
  baselineSkills: {
    listening: number
    speaking: number
    reading: number
    writing: number
  }
}

const EXAM_PROFILES: Record<ExamType, ExamProfile> = {
  cet4: {
    label: 'CET-4 基础建设',
    daysToExam: 120,
    initialGDP: 0,
    administrativePower: 12,
    baselineWpm: 115,
    baselineSkills: { listening: 0, speaking: 0, reading: 0, writing: 0 },
  },
  cet6: {
    label: 'CET-6 全面扩张',
    daysToExam: 150,
    initialGDP: 0,
    administrativePower: 14,
    baselineWpm: 130,
    baselineSkills: { listening: 0, speaking: 0, reading: 0, writing: 0 },
  },
  kaoyan: {
    label: '考研英语 核心攻坚',
    daysToExam: 220,
    initialGDP: 0,
    administrativePower: 16,
    baselineWpm: 145,
    baselineSkills: { listening: 0, speaking: 0, reading: 0, writing: 0 },
  },
}

export const LAW_DEFINITIONS: LawDefinition[] = [
  { key: 'morningReading', name: '强制晨读法案', description: '每日早间加训，提升全天记忆率。', cost: 3, buffKey: 'memoryRate', buffValue: 0.15 },
  { key: 'deficitFreeze', name: '赤字冻结协议', description: '集中削减积压任务，提升复习效率。', cost: 2, buffKey: 'reviewEfficiency', buffValue: 0.18 },
  { key: 'nightReview', name: '夜战复盘条例', description: '晚间二次巩固，增强专注度。', cost: 2, buffKey: 'focusRate', buffValue: 0.12 },
  { key: 'focusBudget', name: '定向预算增发', description: '集中资源投向高频词汇，增加 GDP 产出。', cost: 4, buffKey: 'gdpBonus', buffValue: 0.1 },
]

export type StudyModeState = StudyModeSnapshot & {
  wordAssets: WordAsset[]
  targetGDP: number
  currentGDP: number
  ssaLoadedCount: number
  ssaHasMore: boolean
  pendingDeficitNotice: string | null
  hasSeenFirstDeficitNotice: boolean
  isNoticeOpen: boolean
  isBriefingOpen: boolean
  _hasHydrated: boolean
  setHasHydrated: (value: boolean) => void
  setHasSeenBriefing: (seen: boolean) => void
  setWordTier: (tier: WordTier) => void
  initializeCampaign: (exam: ExamType) => { ok: boolean; reason?: string }
  hydrateProgress: (snapshot: Partial<StudyModeSnapshot>) => void
  syncVocabularyGDP: (baseAssets: number, points?: GdpHistoryPoint[]) => void
  syncGdpMapping: (mapping: { targetGDP: number; currentGDP: number }) => void
  syncWordAssets: (assets: WordAsset[]) => void
  updateReviewDeficit: (value: number) => void
  syncReviewDeficitFromLearning: (learningCount: number, options?: { source?: 'recon' | 'overdue' | 'manual'; pointsPerItem?: number }) => void
  dismissDeficitNotice: () => void
  syncSkillBalance: (skills: Partial<StudyModeState['skillBalance']>) => void
  enactLaw: (lawKey: LawKey) => { ok: boolean; reason?: string }
  registerSsaGain: (gain: number, options?: { combo?: number; dailyCompleted?: boolean }) => void
  acknowledgeSessionGain: () => void
  syncSsaPoolMeta: (meta: { loadedCount: number; hasMore: boolean }) => void
  setSsaMountRequired: (required: boolean) => void
  setDailyWordTarget: (target: number) => void
  openNotice: () => void
  closeNotice: () => void
  openBriefing: () => void
  closeBriefing: () => void
  resetForUserSwitch: () => void
}

const emptyLaws: LawState = {
  morningReading: false,
  deficitFreeze: false,
  nightReview: false,
  focusBudget: false,
}

const emptyBuffs: ActiveBuffs = {
  memoryRate: 0,
  reviewEfficiency: 0,
  focusRate: 0,
  gdpBonus: 0,
}

function toFixedNumber(value: number) {
  return Number(value.toFixed(2))
}

function computeDisplayGDP(baseAssets: number, sessionGains: number) {
  return toFixedNumber(baseAssets + sessionGains)
}

function hasInitializedGdpProgress(input: Partial<StudyModeSnapshot> | Pick<StudyModeState, 'hasSsaExchange' | 'sessionGains'>) {
  return Boolean(input.hasSsaExchange) || (input.sessionGains ?? 0) > 0
}

function buildFlatHistory(displayGDP: number): GdpHistoryPoint[] {
  return ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today'].map((label) => ({ label, value: Math.round(displayGDP) }))
}

function computeSsaGdpBonus(comboCount: number, dailyOpsCompleted: boolean) {
  const comboBonus = Math.min(0.12, Math.max(0, comboCount - 1) * 0.015)
  const dailyBonus = dailyOpsCompleted ? 0.05 : 0
  return toFixedNumber(comboBonus + dailyBonus)
}

function normalizeLaws(laws?: Partial<LawState> | null): LawState {
  return {
    morningReading: Boolean(laws?.morningReading),
    deficitFreeze: Boolean(laws?.deficitFreeze),
    nightReview: Boolean(laws?.nightReview),
    focusBudget: Boolean(laws?.focusBudget),
  }
}

function computeBuffs(laws: Partial<LawState> | null | undefined, ssaGdpBonus: number): ActiveBuffs {
  const safeLaws = normalizeLaws(laws)
  const lawBuffs = LAW_DEFINITIONS.reduce<ActiveBuffs>((buffs, law) => {
    if (safeLaws[law.key]) buffs[law.buffKey] += law.buffValue
    return buffs
  }, { ...emptyBuffs })

  lawBuffs.gdpBonus = toFixedNumber(lawBuffs.gdpBonus + ssaGdpBonus)
  return lawBuffs
}

function shiftHistory(points: GdpHistoryPoint[], sessionGains: number) {
  return points.map((point) => ({ ...point, value: Math.round(point.value + sessionGains) }))
}

function computeReviewDeficitFromLearning(learningCount: number, pointsPerItem = 3) {
  return Math.max(0, learningCount) * Math.max(1, pointsPerItem)
}

function buildDeficitNotice(deficit: number, source: 'recon' | 'overdue' | 'manual' = 'manual') {
  if (source === 'overdue') return `首次赤字警报：检测到逾期复习资产，当前财政赤字 ${deficit} pts。请立即回收前线胶着词汇。`
  if (source === 'recon') return `首次赤字警报：前线资产转入复盘队列，当前财政赤字 ${deficit} pts。请尽快完成复习清算。`
  return `首次赤字警报：当前财政赤字已升至 ${deficit} pts。请优先处理复习任务。`
}

export function getStudyModeSnapshot(state: StudyModeState): StudyModeSnapshot {
  return {
    hasSeenBriefing: state.hasSeenBriefing,
    selectedExam: state.selectedExam,
    selectedWordTier: state.selectedWordTier,
    hasChosenWordTier: state.hasChosenWordTier,
    examLabel: state.examLabel,
    daysToExam: state.daysToExam,
    administrativePower: state.administrativePower,
    baseAdministrativePower: state.baseAdministrativePower,
    baseAssets: state.baseAssets,
    sessionGains: state.sessionGains,
    lastSessionGain: state.lastSessionGain,
    hasSsaExchange: state.hasSsaExchange,
    comboCount: state.comboCount,
    dailyOpsCompleted: state.dailyOpsCompleted,
    ssaGdpBonus: state.ssaGdpBonus,
    vocabularyGDP: state.vocabularyGDP,
    baselineWpm: state.baselineWpm,
    skillBalance: state.skillBalance,
    reviewDeficit: state.reviewDeficit,
    laws: state.laws,
    activeBuffs: state.activeBuffs,
    gdpHistory: state.gdpHistory,
    ssaLoadedCount: state.ssaLoadedCount,
    ssaHasMore: state.ssaHasMore,
    ssaMountRequired: state.ssaMountRequired,
    pendingDeficitNotice: state.pendingDeficitNotice,
    hasSeenFirstDeficitNotice: state.hasSeenFirstDeficitNotice,
    lastBriefingAt: state.lastBriefingAt,
    dailyWordTarget: state.dailyWordTarget,
  }
}

export const useStudyModeStore = create<StudyModeState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      isNoticeOpen: false,
      openNotice: () => set({ isNoticeOpen: true }),
      closeNotice: () => set({ isNoticeOpen: false }),
      isBriefingOpen: false,
      openBriefing: () => set({ isBriefingOpen: true }),
      closeBriefing: () => set({ isBriefingOpen: false }),
      hasSeenBriefing: false,
      selectedExam: null,
      selectedWordTier: 'core',
      hasChosenWordTier: false,
      examLabel: '',
      daysToExam: 0,
      administrativePower: 0,
      baseAdministrativePower: 0,
      baseAssets: 0,
      sessionGains: 0,
      lastSessionGain: 0,
      hasSsaExchange: false,
      comboCount: 0,
      dailyOpsCompleted: false,
      ssaGdpBonus: 0,
      vocabularyGDP: 0,
      baselineWpm: 0,
      skillBalance: { listening: 0, speaking: 0, reading: 0, writing: 0 },
      reviewDeficit: 0,
      laws: { ...emptyLaws },
      activeBuffs: { ...emptyBuffs },
      gdpHistory: [],
      targetGDP: 0,
      currentGDP: 0,
      ssaLoadedCount: 0,
      ssaHasMore: true,
      ssaMountRequired: false,
      wordAssets: [],
      pendingDeficitNotice: null,
      hasSeenFirstDeficitNotice: false,
      lastBriefingAt: null,
      dailyWordTarget: 20,
      setHasSeenBriefing: (seen) => set({ hasSeenBriefing: seen, lastBriefingAt: seen ? new Date().toISOString() : null }),
      setWordTier: (tier: WordTier) => set({ selectedWordTier: tier, hasChosenWordTier: true }),
      initializeCampaign: (exam) => {
        const profile = EXAM_PROFILES[exam]
        set((current) => {
          const isSameExam = current.selectedExam === exam
          const nextBaseAssets = isSameExam && current.baseAssets > 0 ? current.baseAssets : profile.initialGDP
          const nextSessionGains = isSameExam ? current.sessionGains : 0
          const nextComboCount = isSameExam ? current.comboCount : 0
          const nextDailyOpsCompleted = isSameExam ? current.dailyOpsCompleted : false
          const nextSsaGdpBonus = isSameExam ? current.ssaGdpBonus : 0
          const nextHasSsaExchange = isSameExam ? current.hasSsaExchange : false
          const nextLaws = isSameExam ? normalizeLaws(current.laws) : { ...emptyLaws }
          const nextActiveBuffs = computeBuffs(nextLaws, nextSsaGdpBonus)
          // 切换词书时 GDP 清零，同一词书保留历史数据
          const displayGDP = isSameExam ? computeDisplayGDP(nextBaseAssets, nextSessionGains) : 0

          return {
            selectedExam: exam,
            examLabel: profile.label,
            selectedWordTier: isSameExam ? current.selectedWordTier : 'core',
            hasChosenWordTier: isSameExam ? current.hasChosenWordTier : false,
            daysToExam: profile.daysToExam,
            baseAssets: isSameExam ? nextBaseAssets : 0,
            sessionGains: nextSessionGains,
            lastSessionGain: isSameExam ? current.lastSessionGain : 0,
            hasSsaExchange: nextHasSsaExchange,
            comboCount: nextComboCount,
            dailyOpsCompleted: nextDailyOpsCompleted,
            ssaGdpBonus: nextSsaGdpBonus,
            vocabularyGDP: displayGDP,
            administrativePower: profile.administrativePower,
            baseAdministrativePower: profile.administrativePower,
            baselineWpm: profile.baselineWpm,
            skillBalance: isSameExam && current.skillBalance.reading > 0 ? current.skillBalance : profile.baselineSkills,
            reviewDeficit: isSameExam ? current.reviewDeficit : 0,
            laws: nextLaws,
            activeBuffs: nextActiveBuffs,
            gdpHistory: isSameExam && current.gdpHistory.length > 0 ? current.gdpHistory : [],
            targetGDP: isSameExam ? current.targetGDP : 0,
            currentGDP: isSameExam ? current.currentGDP : 0,
            ssaMountRequired: false,
            wordAssets: isSameExam ? current.wordAssets : [],
          }
        })
        return { ok: true }
      },
      hydrateProgress: (snapshot) => set((state) => {
        const nextHasSsaExchange = snapshot.hasSsaExchange ?? state.hasSsaExchange
        const nextSessionGains = nextHasSsaExchange ? (snapshot.sessionGains ?? state.sessionGains) : 0
        const hasProgress = hasInitializedGdpProgress({ hasSsaExchange: nextHasSsaExchange, sessionGains: nextSessionGains })
        const nextBaseAssets = hasProgress ? (snapshot.baseAssets ?? state.baseAssets) : 0
        const nextComboCount = snapshot.comboCount ?? state.comboCount
        const nextDailyOpsCompleted = snapshot.dailyOpsCompleted ?? state.dailyOpsCompleted
        const nextSsaGdpBonus = snapshot.ssaGdpBonus ?? computeSsaGdpBonus(nextComboCount, nextDailyOpsCompleted)
        const nextLaws = normalizeLaws(snapshot.laws ?? state.laws)
        const nextVocabularyGDP = hasProgress ? computeDisplayGDP(nextBaseAssets, nextSessionGains) : 0
        return {
          ...state,
          ...snapshot,
          hasSsaExchange: nextHasSsaExchange,
          baseAssets: nextBaseAssets,
          sessionGains: nextSessionGains,
          comboCount: nextComboCount,
          dailyOpsCompleted: nextDailyOpsCompleted,
          ssaGdpBonus: nextSsaGdpBonus,
          laws: nextLaws,
          vocabularyGDP: nextVocabularyGDP,
          activeBuffs: computeBuffs(nextLaws, nextSsaGdpBonus),
          gdpHistory: hasProgress
            ? (snapshot.gdpHistory?.length ? snapshot.gdpHistory : nextHasSsaExchange ? state.gdpHistory : buildFlatHistory(nextVocabularyGDP))
            : [],
        }
      }),
      syncVocabularyGDP: (baseAssets, points) => {
        set((state) => {
          // Only zero out if there's genuinely no data — don't clear when called
          // from dashboard with a freshly-computed baseAssets value.
          if (baseAssets <= 0 && !hasInitializedGdpProgress(state)) {
            return {
              baseAssets: 0,
              sessionGains: 0,
              vocabularyGDP: 0,
              gdpHistory: [],
            }
          }
          const nextBaseAssets = toFixedNumber(baseAssets)
          const displayGDP = computeDisplayGDP(nextBaseAssets, state.sessionGains)
          const nextHistory = points?.length
            ? shiftHistory(points, state.sessionGains)
            : state.hasSsaExchange || state.gdpHistory.length > 0
              ? [...state.gdpHistory.slice(-6), { label: 'Now', value: Math.round(displayGDP) }]
              : buildFlatHistory(displayGDP)
          return {
            baseAssets: nextBaseAssets,
            vocabularyGDP: displayGDP,
            gdpHistory: nextHistory,
          }
        })
      },
      syncGdpMapping: (mapping) => set({
        targetGDP: Math.max(0, Math.round(mapping.targetGDP)),
        currentGDP: Math.max(0, Math.round(mapping.currentGDP)),
      }),
      syncWordAssets: (assets) => set({ wordAssets: assets }),
      updateReviewDeficit: (value) => set((state) => {
        const nextValue = Math.max(0, value)
        const shouldNotify = state.reviewDeficit === 0 && nextValue > 0 && !state.hasSeenFirstDeficitNotice
        return {
          reviewDeficit: nextValue,
          pendingDeficitNotice: shouldNotify ? buildDeficitNotice(nextValue, 'manual') : state.pendingDeficitNotice,
          hasSeenFirstDeficitNotice: shouldNotify ? true : state.hasSeenFirstDeficitNotice,
        }
      }),
      syncReviewDeficitFromLearning: (learningCount, options) => set((state) => {
        const nextValue = computeReviewDeficitFromLearning(learningCount, options?.pointsPerItem)
        const source = options?.source ?? 'manual'
        const shouldNotify = state.reviewDeficit === 0 && nextValue > 0 && !state.hasSeenFirstDeficitNotice
        return {
          reviewDeficit: nextValue,
          pendingDeficitNotice: shouldNotify ? buildDeficitNotice(nextValue, source) : state.pendingDeficitNotice,
          hasSeenFirstDeficitNotice: shouldNotify ? true : state.hasSeenFirstDeficitNotice,
        }
      }),
      dismissDeficitNotice: () => set({ pendingDeficitNotice: null }),
      syncSkillBalance: (skills) => set((state) => ({ skillBalance: { ...state.skillBalance, ...skills } })),
      enactLaw: (lawKey) => {
        const state = get()
        const target = LAW_DEFINITIONS.find((law) => law.key === lawKey)
        if (!target) return { ok: false, reason: '未找到对应法案' }

        const safeCurrentLaws = normalizeLaws(state.laws)
        const nextLaws = { ...safeCurrentLaws, [lawKey]: !safeCurrentLaws[lawKey] }
        const spentPower = LAW_DEFINITIONS.reduce((sum, law) => sum + (nextLaws[law.key] ? law.cost : 0), 0)
        if (spentPower > state.baseAdministrativePower) return { ok: false, reason: '行政力不足，无法签署更多法案' }

        set({
          laws: nextLaws,
          activeBuffs: computeBuffs(nextLaws, state.ssaGdpBonus),
          administrativePower: state.baseAdministrativePower - spentPower,
        })
        return { ok: true }
      },
      registerSsaGain: (gain, options) => {
        set((state) => {
          const safeGain = toFixedNumber(Math.max(0, gain))
          const nextSessionGains = toFixedNumber(state.sessionGains + safeGain)
          const nextComboCount = Math.max(1, options?.combo ?? state.comboCount + 1)
          const nextDailyOpsCompleted = options?.dailyCompleted ?? state.dailyOpsCompleted
          const nextSsaGdpBonus = computeSsaGdpBonus(nextComboCount, nextDailyOpsCompleted)
          const nextVocabularyGDP = computeDisplayGDP(state.baseAssets, nextSessionGains)
          const nextHistoryBase = state.hasSsaExchange && state.gdpHistory.length ? [...state.gdpHistory.slice(-6)] : buildFlatHistory(state.baseAssets)
          const nextHistory = [...nextHistoryBase.slice(-6), { label: `+${Math.round(safeGain)}`, value: Math.round(nextVocabularyGDP) }].slice(-7)

          return {
            sessionGains: nextSessionGains,
            lastSessionGain: safeGain,
            hasSsaExchange: true,
            comboCount: nextComboCount,
            dailyOpsCompleted: nextDailyOpsCompleted,
            ssaGdpBonus: nextSsaGdpBonus,
            vocabularyGDP: nextVocabularyGDP,
            activeBuffs: computeBuffs(state.laws, nextSsaGdpBonus),
            gdpHistory: nextHistory,
          }
        })
      },
      acknowledgeSessionGain: () => set({ lastSessionGain: 0 }),
      syncSsaPoolMeta: (meta) => set({ ssaLoadedCount: meta.loadedCount, ssaHasMore: meta.hasMore }),
      setSsaMountRequired: (required) => set({ ssaMountRequired: required }),
      setDailyWordTarget: (target) => set({ dailyWordTarget: Math.max(1, Math.min(200, target)) }),
      resetForUserSwitch: () => {
        set({
          hasSeenBriefing: false,
          selectedExam: null,
          selectedWordTier: 'core',
          hasChosenWordTier: false,
          examLabel: '',
          daysToExam: 0,
          administrativePower: 0,
          baseAdministrativePower: 0,
          baseAssets: 0,
          sessionGains: 0,
          lastSessionGain: 0,
          hasSsaExchange: false,
          comboCount: 0,
          dailyOpsCompleted: false,
          ssaGdpBonus: 0,
          vocabularyGDP: 0,
          baselineWpm: 0,
          skillBalance: { listening: 0, speaking: 0, reading: 0, writing: 0 },
          reviewDeficit: 0,
          laws: { ...emptyLaws },
          activeBuffs: { ...emptyBuffs },
          gdpHistory: [],
          targetGDP: 0,
          currentGDP: 0,
          ssaLoadedCount: 0,
          ssaHasMore: true,
          ssaMountRequired: false,
          wordAssets: [],
          pendingDeficitNotice: null,
          hasSeenFirstDeficitNotice: false,
          lastBriefingAt: null,
          dailyWordTarget: 20,
        })
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('study-mode-war-room')
        }
      },
    }),
    {
      name: 'study-mode-war-room',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<StudyModeState> | undefined
        if (!state) return persistedState as StudyModeState

        if (!hasInitializedGdpProgress({ hasSsaExchange: state.hasSsaExchange, sessionGains: state.sessionGains })) {
          return {
            ...state,
            baseAssets: 0,
            sessionGains: 0,
            lastSessionGain: 0,
            hasSsaExchange: false,
            vocabularyGDP: 0,
            gdpHistory: [],
          } as StudyModeState
        }

        return persistedState as StudyModeState
      },
      partialize: (state) => ({
        hasSeenBriefing: state.hasSeenBriefing,
        selectedExam: state.selectedExam,
        selectedWordTier: state.selectedWordTier,
        hasChosenWordTier: state.hasChosenWordTier,
        examLabel: state.examLabel,
        daysToExam: state.daysToExam,
        administrativePower: state.administrativePower,
        baseAdministrativePower: state.baseAdministrativePower,
        baseAssets: state.baseAssets,
        sessionGains: state.sessionGains,
        lastSessionGain: state.lastSessionGain,
        hasSsaExchange: state.hasSsaExchange,
        comboCount: state.comboCount,
        dailyOpsCompleted: state.dailyOpsCompleted,
        ssaGdpBonus: state.ssaGdpBonus,
        vocabularyGDP: state.vocabularyGDP,
        baselineWpm: state.baselineWpm,
        skillBalance: state.skillBalance,
        reviewDeficit: state.reviewDeficit,
        laws: state.laws,
        activeBuffs: state.activeBuffs,
        gdpHistory: state.gdpHistory,
        ssaMountRequired: state.ssaMountRequired,
        pendingDeficitNotice: state.pendingDeficitNotice,
        hasSeenFirstDeficitNotice: state.hasSeenFirstDeficitNotice,
        lastBriefingAt: state.lastBriefingAt,
        dailyWordTarget: state.dailyWordTarget,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)











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
  lastBriefingAt: string | null
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
    initialGDP: 1600,
    administrativePower: 12,
    baselineWpm: 115,
    baselineSkills: { listening: 48, speaking: 42, reading: 51, writing: 40 },
  },
  cet6: {
    label: 'CET-6 全面扩张',
    daysToExam: 150,
    initialGDP: 2800,
    administrativePower: 14,
    baselineWpm: 130,
    baselineSkills: { listening: 57, speaking: 52, reading: 60, writing: 49 },
  },
  kaoyan: {
    label: '考研英语 核心攻坚',
    daysToExam: 220,
    initialGDP: 3600,
    administrativePower: 16,
    baselineWpm: 145,
    baselineSkills: { listening: 46, speaking: 44, reading: 67, writing: 56 },
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
  setHasSeenBriefing: (seen: boolean) => void
  setWordTier: (tier: WordTier) => void
  initializeCampaign: (exam: ExamType) => { ok: boolean; reason?: string }
  hydrateProgress: (snapshot: Partial<StudyModeSnapshot>) => void
  syncVocabularyGDP: (gdp: number, points?: GdpHistoryPoint[]) => void
  syncWordAssets: (assets: WordAsset[]) => void
  updateReviewDeficit: (value: number) => void
  syncSkillBalance: (skills: Partial<StudyModeState['skillBalance']>) => void
  enactLaw: (lawKey: LawKey) => { ok: boolean; reason?: string }
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

function buildInitialHistory(initialGDP: number): GdpHistoryPoint[] {
  return [
    { label: 'D-6', value: Math.round(initialGDP * 0.72) },
    { label: 'D-5', value: Math.round(initialGDP * 0.78) },
    { label: 'D-4', value: Math.round(initialGDP * 0.84) },
    { label: 'D-3', value: Math.round(initialGDP * 0.9) },
    { label: 'D-2', value: Math.round(initialGDP * 0.95) },
    { label: 'D-1', value: Math.round(initialGDP * 0.98) },
    { label: 'Today', value: initialGDP },
  ]
}

function computeBuffs(laws: LawState): ActiveBuffs {
  return LAW_DEFINITIONS.reduce<ActiveBuffs>((buffs, law) => {
    if (laws[law.key]) buffs[law.buffKey] += law.buffValue
    return buffs
  }, { ...emptyBuffs })
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
    vocabularyGDP: state.vocabularyGDP,
    baselineWpm: state.baselineWpm,
    skillBalance: state.skillBalance,
    reviewDeficit: state.reviewDeficit,
    laws: state.laws,
    activeBuffs: state.activeBuffs,
    gdpHistory: state.gdpHistory,
    lastBriefingAt: state.lastBriefingAt,
  }
}

export const useStudyModeStore = create<StudyModeState>()(
  persist(
    (set, get) => ({
      hasSeenBriefing: false,
      selectedExam: null,
      selectedWordTier: 'core',
      hasChosenWordTier: false,
      examLabel: '',
      daysToExam: 0,
      administrativePower: 0,
      baseAdministrativePower: 0,
      vocabularyGDP: 0,
      baselineWpm: 0,
      skillBalance: { listening: 0, speaking: 0, reading: 0, writing: 0 },
      reviewDeficit: 0,
      laws: { ...emptyLaws },
      activeBuffs: { ...emptyBuffs },
      gdpHistory: [],
      wordAssets: [],
      lastBriefingAt: null,
      setHasSeenBriefing: (seen) => set({ hasSeenBriefing: seen, lastBriefingAt: seen ? new Date().toISOString() : null }),
      setWordTier: (tier: WordTier) => set({ selectedWordTier: tier, hasChosenWordTier: true }),
      initializeCampaign: (exam) => {
        const profile = EXAM_PROFILES[exam]
        set((current) => ({
          selectedExam: exam,
          examLabel: profile.label,
          selectedWordTier: current.selectedExam === exam ? current.selectedWordTier : 'core',
          hasChosenWordTier: current.selectedExam === exam ? current.hasChosenWordTier : false,
          daysToExam: profile.daysToExam,
          vocabularyGDP: current.vocabularyGDP > 0 && current.selectedExam === exam ? current.vocabularyGDP : profile.initialGDP,
          administrativePower: profile.administrativePower,
          baseAdministrativePower: profile.administrativePower,
          baselineWpm: profile.baselineWpm,
          skillBalance: current.selectedExam === exam && current.skillBalance.reading > 0 ? current.skillBalance : profile.baselineSkills,
          reviewDeficit: current.reviewDeficit > 0 && current.selectedExam === exam ? current.reviewDeficit : exam === 'kaoyan' ? 26 : exam === 'cet6' ? 18 : 12,
          laws: current.selectedExam === exam ? current.laws : { ...emptyLaws },
          activeBuffs: current.selectedExam === exam ? current.activeBuffs : { ...emptyBuffs },
          gdpHistory: current.gdpHistory.length > 0 && current.selectedExam === exam ? current.gdpHistory : buildInitialHistory(profile.initialGDP),
        }))
        return { ok: true }
      },
      hydrateProgress: (snapshot) => set((state) => ({ ...state, ...snapshot })),
      syncVocabularyGDP: (gdp, points) => {
        set((state) => ({
          vocabularyGDP: gdp,
          gdpHistory: points && points.length > 0 ? points : [...state.gdpHistory.slice(-6), { label: 'Now', value: gdp }],
        }))
      },
      syncWordAssets: (assets) => set({ wordAssets: assets }),
      updateReviewDeficit: (value) => set({ reviewDeficit: Math.max(0, value) }),
      syncSkillBalance: (skills) => set((state) => ({ skillBalance: { ...state.skillBalance, ...skills } })),
      enactLaw: (lawKey) => {
        const state = get()
        const target = LAW_DEFINITIONS.find((law) => law.key === lawKey)
        if (!target) return { ok: false, reason: '未找到对应法案' }

        const nextLaws = { ...state.laws, [lawKey]: !state.laws[lawKey] }
        const spentPower = LAW_DEFINITIONS.reduce((sum, law) => sum + (nextLaws[law.key] ? law.cost : 0), 0)
        if (spentPower > state.baseAdministrativePower) return { ok: false, reason: '行政力不足，无法签署更多法案' }

        set({ laws: nextLaws, activeBuffs: computeBuffs(nextLaws), administrativePower: state.baseAdministrativePower - spentPower })
        return { ok: true }
      },
    }),
    {
      name: 'study-mode-war-room',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenBriefing: state.hasSeenBriefing,
        selectedExam: state.selectedExam,
        selectedWordTier: state.selectedWordTier,
        hasChosenWordTier: state.hasChosenWordTier,
        examLabel: state.examLabel,
        daysToExam: state.daysToExam,
        administrativePower: state.administrativePower,
        baseAdministrativePower: state.baseAdministrativePower,
        vocabularyGDP: state.vocabularyGDP,
        baselineWpm: state.baselineWpm,
        skillBalance: state.skillBalance,
        reviewDeficit: state.reviewDeficit,
        laws: state.laws,
        activeBuffs: state.activeBuffs,
        gdpHistory: state.gdpHistory,
        lastBriefingAt: state.lastBriefingAt,
      }),
    }
  )
)

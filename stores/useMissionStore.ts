import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { SubjectCategory } from '@/config/subjects'

// ─── Types ───────────────────────────────────────────────────────

export type MissionDifficulty = 'standard' | 'hard' | 'elite'

export type MissionConfig = {
  subjectId: string
  subjectTitle: string
  category: SubjectCategory
  yearCode: string | null   // null = AI mode
  isAiMode: boolean
  difficulty: MissionDifficulty
}

type MissionStore = {
  activeMission: MissionConfig | null
  setMission: (config: MissionConfig) => void
  clearMission: () => void
}

// ─── Store ────────────────────────────────────────────────────────

export const useMissionStore = create<MissionStore>()(
  persist(
    (set) => ({
      activeMission: null,
      setMission: (config) => set({ activeMission: config }),
      clearMission: () => set({ activeMission: null }),
    }),
    {
      name: 'mission-config',
      storage: createJSONStorage(() => localStorage),
      // Only persist the mission config, not transient UI state
      partialize: (state) => ({ activeMission: state.activeMission }),
    },
  ),
)

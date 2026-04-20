import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EssayState {
  dailyImageQuota: number
  lastResetDate: string
  activeTopic: string
  decrementImageQuota: () => void
  resetQuotaIfNeeded: () => void
  setActiveTopic: (topic: string) => void
  clearTopic: () => void
  getPolicyCode: (topic: string) => string
}

const DAILY_IMAGE_QUOTA = 5

export const useEssayStore = create<EssayState>()(
  persist(
    (set, get) => ({
      dailyImageQuota: DAILY_IMAGE_QUOTA,
      lastResetDate: new Date().toDateString(),
      activeTopic: '',

      decrementImageQuota: () => {
        set((state) => ({
          dailyImageQuota: Math.max(0, state.dailyImageQuota - 1)
        }))
      },

      resetQuotaIfNeeded: () => {
        const today = new Date().toDateString()
        const { lastResetDate } = get()

        if (today !== lastResetDate) {
          set({
            dailyImageQuota: DAILY_IMAGE_QUOTA,
            lastResetDate: today
          })
        }
      },

      setActiveTopic: (topic: string) => {
        set({ activeTopic: topic })
      },

      clearTopic: () => {
        set({ activeTopic: '' })
      },

      getPolicyCode: (topic: string) => {
        if (!topic) return 'PENDING_CODE'
        try {
          const encoded = btoa(encodeURIComponent(topic))
          return `SSA-${encoded.substring(0, 8).toUpperCase()}`
        } catch {
          return 'SSA-INVALID'
        }
      }
    }),
    {
      name: 'essay-storage'
    }
  )
)

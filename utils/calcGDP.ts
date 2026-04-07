import type { WordAsset } from '@/stores/useStudyModeStore'

export type GDPInput = Pick<WordAsset, 'difficultyWeight' | 'masteryLevel'>

export function calcGDP(assets: GDPInput[]): number {
  if (!assets.length) {
    return 0
  }

  return Math.round(
    assets.reduce((total, asset) => {
      const normalizedMastery = Math.min(Math.max(asset.masteryLevel, 0), 1)
      const weightedOutput = 100 * asset.difficultyWeight * (0.35 + normalizedMastery * 0.65)
      return total + weightedOutput
    }, 0)
  )
}

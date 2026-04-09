export type SsaAssetWord = {
  word: string
  meaning: string | null
  status: 'known' | 'learning' | 'new'
}

export type SsaAssetAnalysisInput = {
  exam: string
  tier: 'core' | 'full'
  bucketLabel: string
  words: SsaAssetWord[]
}

export async function analyzeSsaAssetCategory(input: SsaAssetAnalysisInput) {
  const response = await fetch('/api/ssa/asset-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = await response.json().catch(() => ({} as { analysis?: string; error?: string }))
  if (!response.ok) {
    throw new Error(data.error ?? '资产分析请求失败')
  }

  return data as { analysis: string }
}

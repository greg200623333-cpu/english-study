'use client'

import { useParams } from 'next/navigation'
import { SCENARIOS } from '@/types/scenario'
import ConversationRoom from '@/components/portal/ConversationRoom'

export default function ScenarioPage() {
  const params = useParams()
  const scenarioId = params.id as string

  const scenario = SCENARIOS.find(s => s.id === scenarioId)

  if (!scenario) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">场景未找到</h1>
          <p className="text-slate-400">请返回选择有效的场景</p>
        </div>
      </div>
    )
  }

  return <ConversationRoom scenario={scenario} />
}

import { SsaCommandCenter } from '@/components/study-mode/SsaCommandCenter'

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

export default function SsaPage() {
  return <SsaCommandCenter />
}

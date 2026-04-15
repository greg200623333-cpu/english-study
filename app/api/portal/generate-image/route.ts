import { NextRequest, NextResponse } from 'next/server'
import { generateArchitectureImage } from '@/lib/imageGeneration'

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { term } = await req.json()
    if (!term || typeof term !== 'string') {
      return NextResponse.json({ error: 'Missing term' }, { status: 400 })
    }
    const result = await generateArchitectureImage(term)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

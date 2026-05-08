export interface OralEvaluationResult {
  overall: {
    grade: 'S' | 'A' | 'B' | 'C' | 'D'
    score: number
  }
  dimensions: {
    pronunciation: number
    fluency: number
    accuracy: number
  }
  suggestions: string[]
  grammarErrors: GrammarError[]
}

export interface GrammarError {
  original: string
  corrected: string
  explanation: string
  position?: number
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

export interface AudioData {
  blob: Blob
  base64: string
  duration: number
  timestamp: Date
}

export interface ConversationRecord {
  messageId: string
  role: 'user' | 'assistant'
  text: string
  audio?: AudioData
  timestamp: Date
}

export interface YoudaoAIChatRequest {
  q?: string
  audio?: string
  langType: 'en' | 'zh-CHS'
  voice?: string
  scene: string
  taskId?: string
  history?: Array<{
    speaker: 'System' | 'User'
    content: string
  }>
}

export interface YoudaoAIChatResponse {
  errorCode: string
  taskId: string
  reply: string
  tts?: string
  extra?: {
    grammar?: GrammarError[]
    pronunciation?: {
      score: number
      details: string
    }
  }
}

export interface YoudaoOralEvalRequest {
  audio: string
  langType: 'en'
  audioType: 'wav' | 'mp3'
  refText?: string
}

export interface YoudaoOralEvalResponse {
  errorCode: string
  result: {
    overall: number
    pronunciation: number
    fluency: number
    integrity: number
    details?: any
  }
}

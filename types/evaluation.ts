// 口语评分结果
export interface OralEvaluationResult {
  overall: {
    grade: 'S' | 'A' | 'B' | 'C' | 'D'
    score: number // 0-100
  }
  dimensions: {
    pronunciation: number // 发音 0-100
    fluency: number // 流利度 0-100
    accuracy: number // 准确性 0-100
  }
  suggestions: string[] // 改进建议
  grammarErrors: GrammarError[] // 语法错误
}

// 语法错误
export interface GrammarError {
  original: string // 原文
  corrected: string // 修正后
  explanation: string // 解释
  position?: number // 在对话中的位置
}

// 音频录制状态
export type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

// 音频数据
export interface AudioData {
  blob: Blob
  base64: string
  duration: number // 秒
  timestamp: Date
}

// 对话记录（用于评分）
export interface ConversationRecord {
  messageId: string
  role: 'user' | 'assistant'
  text: string
  audio?: AudioData
  timestamp: Date
}

// 有道 AI Chat API 请求
export interface YoudaoAIChatRequest {
  q?: string // 文本输入
  audio?: string // 音频 Base64（与 q 二选一）
  langType: 'en' | 'zh-CHS'
  voice?: string // 音色选择
  scene: string // 场景
  taskId?: string // 会话 ID
  history?: Array<{
    speaker: 'System' | 'User'
    content: string
  }>
}

// 有道 AI Chat API 响应
export interface YoudaoAIChatResponse {
  errorCode: string
  taskId: string
  reply: string
  tts?: string // TTS 音频 URL 或 Base64
  extra?: {
    grammar?: GrammarError[]
    pronunciation?: {
      score: number
      details: string
    }
  }
}

// 有道口语评测 API 请求
export interface YoudaoOralEvalRequest {
  audio: string // Base64 音频
  langType: 'en'
  audioType: 'wav' | 'mp3'
  refText?: string // 参考文本（可选）
}

// 有道口语评测 API 响应
export interface YoudaoOralEvalResponse {
  errorCode: string
  result: {
    overall: number // 总分
    pronunciation: number
    fluency: number
    integrity: number // 完整度
    details?: any
  }
}

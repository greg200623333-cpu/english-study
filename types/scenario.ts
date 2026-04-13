// 场景类型定义
export interface Scenario {
  id: string
  title: string
  subtitle: string
  icon: string
  description: string
  topic: string
  systemPrompt: string
  welcomeMessage: string
  practiceTips: string[]
}

// 对话消息类型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  audioBase64?: string // 用户消息的音频数据
  ttsUrl?: string // AI 消息的 TTS 音频
  grammarErrors?: Array<{
    original: string
    corrected: string
    explanation: string
  }>
}

// 有道 AI 对话历史格式
export interface YoudaoDialogHistory {
  speaker: 'System' | 'User'
  content: string
}

// 有道 AI 对话会话状态
export interface YoudaoChatSession {
  taskId: string
  scene: string
  history: YoudaoDialogHistory[]
}

// 场景配置
export const SCENARIOS: Scenario[] = [
  {
    id: 'technical-interview',
    title: '技术面试',
    subtitle: 'Technical Interview',
    icon: 'Briefcase',
    description: '模拟大厂技术面试，考察数据结构、算法、系统设计等核心能力',
    topic: 'Technical interview for software engineer position',
    systemPrompt: `You are a senior technical interviewer from a top tech company. Conduct the interview in English only.
- Ask questions about data structures, algorithms, system design, and coding practices
- Probe deeper based on the candidate's answers
- Provide constructive feedback
- Keep responses professional and concise
- Focus on computer science fundamentals and problem-solving abilities`,
    welcomeMessage: 'Hello! I\'m your technical interviewer today. We\'ll be discussing your technical background, problem-solving skills, and experience with software development. Let\'s start with a simple question: Can you introduce yourself and tell me about your most challenging project?',
    practiceTips: [
      '使用 STAR 法则（Situation, Task, Action, Result）描述项目经验',
      '准备好讲解你的技术栈和架构决策',
      '遇到不会的问题，诚实表达并展示学习意愿',
      '注意使用专业术语，如 "scalability", "trade-off", "bottleneck"',
      '面试结束时可以主动提问，展现你的好奇心'
    ]
  },
  {
    id: 'code-review',
    title: '代码审查',
    subtitle: 'Code Review Discussion',
    icon: 'Search',
    description: '模拟代码审查讨论，关注代码质量、最佳实践和性能优化',
    topic: 'Code review discussion with tech lead',
    systemPrompt: `You are a tech lead conducting a code review session. Communicate in English only.
- Discuss code quality, best practices, and maintainability
- Ask about design decisions and suggest improvements
- Focus on robustness, naming conventions, and performance optimization
- Be constructive and educational in your feedback
- Encourage clean code principles`,
    welcomeMessage: 'Hi! I\'m your tech lead and I\'ll be reviewing your code today. Let\'s discuss your implementation, identify potential issues, and explore ways to improve code quality. To start, can you walk me through your recent pull request and explain the main changes you made?',
    practiceTips: [
      '学会使用 "I noticed...", "Have you considered...", "What if..." 等委婉表达',
      '讨论代码时要具体，引用行号或函数名',
      '关注代码的可读性、性能和安全性',
      '提出改进建议时，解释"为什么"而不只是"怎么做"',
      '接受批评时保持开放心态，用 "Good point", "I see your concern" 回应'
    ]
  },
  {
    id: 'daily-standup',
    title: '每日站会',
    subtitle: 'Daily Standup Meeting',
    icon: 'Mic',
    description: '模拟敏捷开发每日站会，练习简洁高效的英文汇报',
    topic: 'Daily standup meeting with scrum master',
    systemPrompt: `You are a Scrum Master facilitating a daily standup meeting. Speak in English only.
- Ask about: What did you do yesterday? What will you do today? Any blockers?
- Keep the conversation focused and efficient
- Encourage clear and concise communication
- Help identify and address blockers
- Maintain a supportive and collaborative tone`,
    welcomeMessage: 'Good morning! Welcome to today\'s daily standup. As your Scrum Master, I\'ll guide you through our three key questions. Please keep your updates concise and focused. Let\'s begin: What did you accomplish yesterday?',
    practiceTips: [
      '使用过去时描述昨天的工作："I completed...", "I fixed...", "I reviewed..."',
      '使用将来时或计划时态描述今天的任务："I will...", "I\'m planning to...", "I\'ll focus on..."',
      '汇报阻碍时要具体："I\'m blocked by...", "I need help with...", "Waiting for..."',
      '保持简洁，每个问题控制在 1-2 分钟内',
      '使用敏捷术语：sprint, user story, backlog, code review, merge conflict'
    ]
  },
]

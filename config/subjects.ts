// ─── Subject config ──────────────────────────────────────────────
// Single source of truth for all exam subjects.
// quiz/page.tsx and MissionBriefingModal both read from here.

export type SubjectCategory = 'cet4' | 'cet6' | 'kaoyan1' | 'kaoyan2'

export type Subject = {
  id: string
  title: string
  desc: string
  category: SubjectCategory
  section: string   // section name within the exam (e.g. '基建系统')
  weight: string    // score weight string (e.g. '35%' or '40 分')
}

export type ExamConfig = {
  category: SubjectCategory
  label: string
  score: string
  color: string
  focus?: string
  subjects: Subject[]
}

// ─── CET-4 ───────────────────────────────────────────────────────

const CET4_SUBJECTS: Subject[] = [
  { id: 'writing',           title: '写作',     desc: '先稳住政策输出能力。',     category: 'cet4', section: '外交输出', weight: '15%' },
  { id: 'listening_news',    title: '新闻听力', desc: '快节奏信息截获。',         category: 'cet4', section: '情报系统', weight: '35%' },
  { id: 'listening_interview', title: '长对话', desc: '追踪关键角色意图。',       category: 'cet4', section: '情报系统', weight: '35%' },
  { id: 'listening_passage', title: '听力短文', desc: '构建完整情报链。',         category: 'cet4', section: '情报系统', weight: '35%' },
  { id: 'reading_match',     title: '信息匹配', desc: '宏观调度与定位。',         category: 'cet4', section: '基建系统', weight: '35%' },
  { id: 'reading_choice',    title: '仔细阅读', desc: '核心基建能力训练。',       category: 'cet4', section: '基建系统', weight: '35%' },
  { id: 'reading_cloze',     title: '篇章词汇', desc: '修复词汇链路。',           category: 'cet4', section: '基建系统', weight: '35%' },
  { id: 'translation',       title: '翻译',     desc: '跨系统语言转换。',         category: 'cet4', section: '翻译中枢', weight: '15%' },
]

// ─── CET-6 ───────────────────────────────────────────────────────

const CET6_SUBJECTS: Subject[] = [
  { id: 'writing',           title: '写作',     desc: '更高压的政策表达。',       category: 'cet6', section: '外交输出', weight: '15%' },
  { id: 'listening_news',    title: '新闻听力', desc: '高频信息突袭。',           category: 'cet6', section: '情报系统', weight: '35%' },
  { id: 'listening_interview', title: '长对话', desc: '多节点关系解读。',         category: 'cet6', section: '情报系统', weight: '35%' },
  { id: 'listening_passage', title: '听力短文', desc: '学术型情报素材。',         category: 'cet6', section: '情报系统', weight: '35%' },
  { id: 'reading_match',     title: '信息匹配', desc: '长文结构治理。',           category: 'cet6', section: '基建系统', weight: '35%' },
  { id: 'reading_choice',    title: '仔细阅读', desc: '逻辑推断升级。',           category: 'cet6', section: '基建系统', weight: '35%' },
  { id: 'reading_cloze',     title: '篇章词汇', desc: '熟词僻义专项。',           category: 'cet6', section: '基建系统', weight: '35%' },
  { id: 'translation',       title: '翻译',     desc: '文化与书面表达转换。',     category: 'cet6', section: '翻译中枢', weight: '15%' },
]

// ─── Kaoyan 1 ────────────────────────────────────────────────────

const KAOYAN1_SUBJECTS: Subject[] = [
  { id: 'cloze',             title: '完形填空', desc: '考验整体语义调度。',       category: 'kaoyan1', section: '资源清算',   weight: '10 分' },
  { id: 'reading',           title: '阅读理解', desc: '核心决战区。',             category: 'kaoyan1', section: '基建主战场', weight: '40 分' },
  { id: 'new_type_match',    title: '新题型匹配', desc: '篇章重组与排序。',       category: 'kaoyan1', section: '基建主战场', weight: '40 分' },
  { id: 'new_type_summary',  title: '英译汉',   desc: '拆解长难句结构。',         category: 'kaoyan1', section: '基建主战场', weight: '40 分' },
  { id: 'writing_small',     title: '小作文',   desc: '短平快政策表达。',         category: 'kaoyan1', section: '外交输出',   weight: '30 分' },
  { id: 'writing_big',       title: '大作文',   desc: '完整立场输出。',           category: 'kaoyan1', section: '外交输出',   weight: '30 分' },
]

// ─── Kaoyan 2 ────────────────────────────────────────────────────

const KAOYAN2_SUBJECTS: Subject[] = [
  { id: 'cloze',             title: '完形填空', desc: '控制语境误差。',           category: 'kaoyan2', section: '资源清算',   weight: '10 分' },
  { id: 'reading',           title: '阅读理解', desc: '偏应用文本调度。',         category: 'kaoyan2', section: '基建主战场', weight: '40 分' },
  { id: 'new_type_match',    title: '新题型',   desc: '结构统筹。',               category: 'kaoyan2', section: '基建主战场', weight: '40 分' },
  { id: 'translation',       title: '翻译',     desc: '段落级转换。',             category: 'kaoyan2', section: '基建主战场', weight: '40 分' },
  { id: 'writing_small',     title: '小作文',   desc: '实用文书格式化。',         category: 'kaoyan2', section: '外交输出',   weight: '30 分' },
  { id: 'writing_big',       title: '大作文',   desc: '图表趋势与论证。',         category: 'kaoyan2', section: '外交输出',   weight: '30 分' },
]

// ─── Exam configs ─────────────────────────────────────────────────

export const EXAM_CONFIGS: ExamConfig[] = [
  {
    category: 'cet4',
    label: 'CET-4 基础建设',
    score: '满分 710 · 130 分钟',
    color: '#22d3ee',
    subjects: CET4_SUBJECTS,
  },
  {
    category: 'cet6',
    label: 'CET-6 全面扩张',
    score: '满分 710 · 130 分钟',
    color: '#8b5cf6',
    subjects: CET6_SUBJECTS,
  },
  {
    category: 'kaoyan1',
    label: '考研英语一 核心攻坚',
    score: '满分 100 · 180 分钟',
    color: '#f97316',
    focus: '学术深度 · 长难句 · 高压逻辑',
    subjects: KAOYAN1_SUBJECTS,
  },
  {
    category: 'kaoyan2',
    label: '考研英语二 战略稳推',
    score: '满分 100 · 180 分钟',
    color: '#34d399',
    focus: '应用写作 · 图表分析 · 实用表达',
    subjects: KAOYAN2_SUBJECTS,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────

export const CET_EXAMS = EXAM_CONFIGS.filter((e) => e.category === 'cet4' || e.category === 'cet6')
export const KAOYAN_EXAMS = EXAM_CONFIGS.filter((e) => e.category === 'kaoyan1' || e.category === 'kaoyan2')

/** Group subjects by section within an exam */
export function groupBySection(subjects: Subject[]): { section: string; weight: string; subjects: Subject[] }[] {
  const map = new Map<string, { weight: string; subjects: Subject[] }>()
  for (const s of subjects) {
    const existing = map.get(s.section)
    if (existing) {
      existing.subjects.push(s)
    } else {
      map.set(s.section, { weight: s.weight, subjects: [s] })
    }
  }
  return Array.from(map.entries()).map(([section, v]) => ({ section, ...v }))
}

/** Get accent color for a category */
export function categoryColor(category: SubjectCategory): string {
  return EXAM_CONFIGS.find((e) => e.category === category)?.color ?? '#22d3ee'
}

/** Find a subject by id + category */
export function findSubject(category: SubjectCategory, subjectId: string): Subject | undefined {
  return EXAM_CONFIGS.find((e) => e.category === category)?.subjects.find((s) => s.id === subjectId)
}

# English Study - SSA 战略勤务局

> 一个基于 **Cyberpunk 军事指挥部** 风格的英语学习系统，将刷题行为转化为战术行动，通过 AI 辅助和真题档案实现高效备考。

## 📋 项目简介

English Study 是一个面向 **CET-4/6** 和**考研英语**的智能学习平台，采用独特的"国家经营"隐喻：

- **SSA 战略勤务局** — 核心指挥中心，管理学习模式、法案系统、技能平衡
- **作战部署台 (OPS)** — 科目练习入口，支持真题档案与 AI 模拟题
- **词汇国库** — 词汇管理系统，分层记忆与复习机制
- **政策输出部** — AI 辅助写作与评分反馈（作文战场）
- **Portal 工作台** — AI 对话场景模拟，支持文档分析、场景聊天
- **算法阅读工作台** — 计算机科学专项阅读训练，集成 Monaco 编辑器

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|---|---|---|
| **Next.js** | 16.2.2 | App Router + Server Components |
| **React** | 19.2.4 | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 4.x | 样式系统 |
| **Framer Motion** | 11.3.0 | 动画与交互 |
| **Zustand** | 5.0.12 | 状态管理 |
| **Supabase** | 2.101.1 | 数据库 + 认证 |
| **Anthropic Claude API** | 0.88.0 | AI 对话与场景模拟 |
| **OpenAI API** | 6.33.0 | AI 题目生成与作文评分 |
| **有道智云 API** | - | ASR 语音识别、TTS 语音合成、口语评测 |
| **ECharts** | 6.0.0 | 数据可视化 |
| **Monaco Editor** | 4.6.0 | 代码编辑器（算法阅读） |
| **Highlight.js** | 11.11.1 | 代码高亮 |
| **React Markdown** | 10.1.0 | Markdown 渲染 |
| **RecordRTC** | 5.6.2 | 音频录制 |

---

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 18
- npm / yarn / pnpm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env.local`：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API (用于题目生成和作文评分)
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1

# Anthropic Claude API (用于 Portal 工作台 AI 对话)
ANTHROPIC_API_KEY=your_anthropic_api_key

# 有道智云 API (用于语音识别、TTS、口语评测)
YOUDAO_APP_KEY=your_youdao_app_key
YOUDAO_APP_SECRET=your_youdao_app_secret

# JWT Secret (用于 session 加密)
JWT_SECRET=your_random_secret_key
```

### 4. 初始化数据库

在 Supabase Dashboard 中执行 `supabase/schema.sql`，创建以下表：

- `profiles` — 用户信息
- `questions` — 题库
- `quiz_records` — 答题记录
- `words` — 词汇库
- `word_records` — 词汇学习记录
- `essays` — 作文记录
- `study_mode_profiles` — 学习模式配置
- `portal_scenarios` — Portal 场景数据
- `portal_conversations` — Portal 对话记录

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 📂 项目结构

```
english-study/
├── app/                      # Next.js App Router
│   ├── (app)/                # 主应用路由组
│   │   ├── dashboard/        # 战略仪表盘
│   │   ├── quiz/             # 作战部署台（题目练习）
│   │   │   └── [category]/[type]/  # 动态路由：科目练习页
│   │   │       ├── listening/      # 听力专项
│   │   │       ├── translation/    # 翻译专项
│   │   │       └── cloze/          # 完形填空专项
│   │   ├── ops/deploy/[subjectId]/ # 任务部署准备页
│   │   ├── ssa/              # SSA 战略勤务局
│   │   ├── words/            # 词汇国库
│   │   ├── essay/            # 政策输出部（作文战场）
│   │   └── profile/          # 个人档案
│   ├── portal/               # Portal 工作台（AI 对话场景）
│   │   └── scenario/[id]/    # 场景模拟页
│   ├── cs/                   # 计算机科学专项
│   │   └── algorithm-reading/ # 算法阅读工作台
│   ├── api/                  # API 路由
│   │   ├── auth/             # 认证接口（登录/注册/登出/会话）
│   │   ├── generate/         # AI 生成接口（题目/词汇/听力）
│   │   ├── essay/            # 作文相关（评分/文本检查/图片检查）
│   │   ├── portal/           # Portal 工作台接口
│   │   │   ├── ai-dialog/    # AI 对话
│   │   │   ├── scenario-chat/ # 场景聊天
│   │   │   ├── doc-analysis/ # 文档分析
│   │   │   ├── generate-image/ # 图片生成
│   │   │   ├── algorithm-workspace/ # 算法工作台
│   │   │   └── algorithm-tooltip/   # 算法提示
│   │   ├── quiz/             # 题目相关（解题）
│   │   ├── translation/      # 翻译评分
│   │   ├── dashboard/        # 仪表盘数据（风险分析）
│   │   ├── ssa/              # SSA 资产分析
│   │   ├── youdao/           # 有道 API（ASR/TTS/AI聊天/口语评测）
│   │   └── tts/              # 文本转语音
│   ├── login/                # 登录页
│   ├── register/             # 注册页
│   └── page.tsx              # 首页
├── components/               # React 组件
│   ├── study-mode/           # 学习模式组件
│   │   ├── MissionBriefingModal.tsx      # 任务简报模态框
│   │   ├── SsaCommandCenter.tsx          # SSA 指挥中心
│   │   ├── VocabularyTreasury.tsx        # 词汇国库
│   │   ├── WarRoomDashboard.tsx          # 作战室仪表盘
│   │   ├── StrategyLawPanel.tsx          # 战略法案面板
│   │   ├── StudyModeShell.tsx            # 学习模式外壳
│   │   ├── StrategicStatusBar.tsx        # 战略状态栏
│   │   ├── StrategicFab.tsx              # 战略浮动按钮
│   │   ├── OnboardingBriefingModal.tsx   # 新手引导简报
│   │   ├── SelectionModal.tsx            # 选择模态框
│   │   └── GdpTicker.tsx                 # GDP 滚动显示
│   ├── portal/               # Portal 工作台组件
│   │   ├── WelcomeScreen.tsx             # 欢迎屏幕
│   │   ├── ScenarioCard.tsx              # 场景卡片
│   │   ├── ScenarioSimulation.tsx        # 场景模拟
│   │   ├── ConversationRoom.tsx          # 对话室
│   │   ├── MarkdownMessage.tsx           # Markdown 消息
│   │   ├── ScoreModal.tsx                # 评分模态框
│   │   ├── DocAnalysis.tsx               # 文档分析
│   │   ├── ArchitectureWorkspace.tsx     # 架构工作台
│   │   ├── ComputerWorkspace.tsx         # 计算机工作台
│   │   └── algorithm-reading/            # 算法阅读组件
│   │       ├── AlgorithmWorkspace.tsx    # 算法工作台
│   │       ├── TerminalPanel.tsx         # 终端面板
│   │       ├── SmartTooltip.tsx          # 智能提示
│   │       └── InstructionOverlay.tsx    # 指令覆盖层
│   ├── essay/                # 作文组件
│   │   └── StrategicEssayInput.tsx       # 战略作文输入
│   ├── debug/                # 调试组件
│   │   └── TTSDebugger.tsx               # TTS 调试器
│   ├── ErrorBoundary.tsx     # 错误边界
│   ├── NoticeModal.tsx       # 通知模态框
│   ├── SystemBriefingModal.tsx # 系统简报模态框
│   ├── HomeBriefingTrigger.tsx # 首页简报触发器
│   └── HomeOnboardingFlow.tsx  # 首页新手引导流程
├── config/                   # 配置文件
│   └── subjects.ts           # 科目配置（单一数据源）
├── stores/                   # Zustand 状态管理
│   ├── useStudyModeStore.ts  # 学习模式状态
│   └── useMissionStore.ts    # 任务配置状态
├── store/                    # 额外的 Store
│   └── essayStore.ts         # 作文状态管理
├── hooks/                    # 自定义 Hooks
│   ├── useWarRoomSync.ts     # 作战室同步
│   ├── useSsaSession.ts      # SSA 会话
│   ├── useReadingTracker.ts  # 阅读追踪
│   ├── useAudioRecorder.ts   # 音频录制
│   └── useYoudaoChat.ts      # 有道聊天
├── lib/                      # 工具库
│   ├── auth.ts               # 认证逻辑
│   ├── session.ts            # 会话管理
│   ├── useSession.ts         # 会话 Hook
│   ├── supabase/             # Supabase 客户端
│   ├── studyModePersistence.ts # 学习模式持久化
│   ├── ssaReviewAlgorithm.ts # SSA 复习算法
│   ├── imageGeneration.ts    # 图片生成
│   ├── apiClient.ts          # API 客户端
│   ├── version.ts            # 版本管理
│   ├── useSpeech.ts          # 语音合成
│   └── useYoudaoTTS.ts       # 有道 TTS
├── supabase/                 # 数据库 Schema
│   └── schema.sql
└── public/                   # 静态资源
    └── data/                 # 静态数据文件
        └── essay-prompts.json # 作文题目数据
```

---

## 🎯 核心功能

### 1. SSA 战略勤务局

- **学习模式选择** — CET-4/6、考研英语一/二
- **法案系统** — 晨读、赤字冻结、夜间复习、专注预算
- **技能平衡** — 听说读写四维雷达图
- **行政力与赤字** — 游戏化学习进度管理
- **资产分析** — AI 驱动的学习状态分析

### 2. 作战部署台 (OPS)

- **科目列表** — 从 `config/subjects.ts` 读取，支持 CET-4/6、考研英语一/二全科目
- **任务准备简报** — 点击科目弹出模态框，选择：
  - **推演模式** — 真题模式 / AI 模式
  - **档案选择** — 历年真题档案（如 2024.06-01）
  - **难度协议** — Standard / Hard / Elite
- **执行部署** — 跳转到 `/ops/deploy/[subjectId]`，再进入练习
- **专项练习** — 听力、翻译、完形填空独立页面

### 3. AI 辅助功能

- **题目生成** — 基于 OpenAI API 动态生成模拟题（阅读/听力/词汇）
- **作文评分** — AI 自动批改，给出分数与改进建议
- **文本/图片检查** — 作文内容多维度检查
- **智能推荐** — 根据答题记录推荐薄弱环节
- **解题辅助** — 题目解析与答案说明

### 4. Portal 工作台

- **场景模拟** — 多种 AI 对话场景（面试、商务、学术等）
- **文档分析** — 上传文档进行 AI 分析
- **架构工作台** — 系统架构设计辅助
- **算法阅读** — 集成 Monaco 编辑器的算法学习环境，支持智能提示

### 5. 词汇国库

- **分层管理** — Core / Full 词汇分级
- **记忆状态** — New / Learning / Known
- **复习机制** — 基于遗忘曲线的智能复习
- **AI 词汇生成** — 自动生成词汇练习题

### 6. 语音功能

- **有道 ASR** — 语音识别，支持口语练习
- **有道 TTS** — 文本转语音，支持发音学习
- **口语评测** — 有道智云口语评分
- **AI 聊天** — 有道 AI 对话练习

---

## 🎨 设计风格

- **Cyberpunk / 军事指挥部** 视觉语言
- **深色主题** — `bg-slate-950` + 青色/紫色强调色
- **等宽字体** — `font-mono` 用于状态栏与代码
- **动效** — Framer Motion 实现扫描、呼吸灯、卡片切换
- **玻璃态** — `backdrop-blur-md` + 半透明背景

---

## 🔐 认证系统

- **JWT Session** — 基于 `jose` 库的无状态认证
- **Bcrypt 密码哈希** — 安全存储用户密码
- **Supabase RLS** — 行级安全策略保护数据

---

## 📊 数据流

```
用户点击科目
  ↓
MissionBriefingModal (选模式/档案/难度)
  ↓
useMissionStore.setMission(config)
  ↓
router.push(/ops/deploy/[subjectId]?mode=archive&archiveId=2024.06-01)
  ↓
DeployPage 读取 store + URL params
  ↓
"进入战场" → /quiz/[category]/[subjectId]
  ↓
根据 isAiMode 决定：
  - true → 调用 /api/generate/questions (OpenAI)
  - false → 从 Supabase questions 表读取真题
  ↓
答题完成 → 提交到 /api/quiz/solve
  ↓
记录保存到 quiz_records 表
  ↓
同步到 SSA 战略勤务局（行政力/赤字更新）
```

### Portal 工作台数据流

```
用户选择场景
  ↓
ScenarioCard → router.push(/portal/scenario/[id])
  ↓
ScenarioSimulation 加载场景配置
  ↓
用户发送消息 → /api/portal/scenario-chat (Anthropic Claude)
  ↓
AI 响应 → 保存到 portal_conversations 表
  ↓
评分与反馈 → ScoreModal 显示
```

### 算法阅读数据流

```
用户进入算法阅读工作台
  ↓
AlgorithmWorkspace 加载 Monaco 编辑器
  ↓
用户选中代码 → /api/portal/algorithm-tooltip (Claude)
  ↓
SmartTooltip 显示 AI 解释
  ↓
用户提问 → /api/portal/algorithm-workspace (Claude)
  ↓
TerminalPanel 显示 AI 回答
```

---

## 🚢 部署（阿里云）

### 环境准备

- 阿里云 ECS（推荐 Ubuntu 22.04）
- Node.js >= 18（建议用 nvm 安装）
- Nginx（反向代理）
- PM2（进程守护）

### 1. 服务器初始化

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18

# 安装 PM2 和 Nginx
npm install -g pm2
sudo apt install nginx -y
```

### 2. 拉取代码

```bash
git clone https://github.com/your-repo/english-study.git
cd english-study
npm install
```

### 3. 配置环境变量

```bash
cp .env.local.example .env.local
vim .env.local
```

填入以下内容：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
ANTHROPIC_API_KEY=your_anthropic_api_key
YOUDAO_APP_KEY=your_youdao_app_key
YOUDAO_APP_SECRET=your_youdao_app_secret
JWT_SECRET=your_random_secret_key
```

### 4. 构建项目

```bash
npm run build
```

### 5. PM2 启动

```bash
pm2 start .next/standalone/server.js --name english-study
pm2 save
pm2 startup   # 设置开机自启
```

常用 PM2 命令：

```bash
pm2 status              # 查看运行状态
pm2 logs english-study  # 查看日志
pm2 restart english-study
pm2 stop english-study
```

### 6. Nginx 反向代理配置

```nginx
# /etc/nginx/sites-available/english-study
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或公网 IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/english-study /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. HTTPS 配置（可选，推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 8. 更新部署

```bash
git pull
npm install
npm run build
pm2 restart english-study
```

### 阿里云安全组配置

在阿里云控制台 → ECS → 安全组，确保以下端口已开放：

| 端口 | 协议 | 用途 |
|---|---|---|
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 22 | TCP | SSH |

---

## 📝 开发规范

- **组件拆分** — 单文件不超过 500 行
- **类型安全** — 所有 API 响应必须定义 TypeScript 类型
- **Config-Driven** — 科目、法案等配置统一放在 `config/` 目录
- **状态隔离** — Zustand store 按职责分离
  - `useStudyModeStore` — 学习模式状态
  - `useMissionStore` — 任务配置状态
  - `essayStore` — 作文状态管理
- **Hooks 复用** — 自定义 Hooks 放在 `hooks/` 目录
- **API 路由规范** — 按功能模块组织（auth/generate/portal/quiz 等）
- **错误处理** — 使用 ErrorBoundary 捕获组件错误
- **性能优化** — 使用 Zustand 选择器避免不必要的重渲染

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

## 📄 License

MIT

---

## 🙏 致谢

- **OpenAI** — AI 题目生成与作文评分
- **Anthropic Claude** — Portal 工作台 AI 对话与场景模拟
- **有道智云** — 语音识别、TTS、口语评测
- **Supabase** — 后端即服务
- **Vercel** — 部署平台
- **Tailwind CSS** — 样式系统
- **Framer Motion** — 动画库
- **Monaco Editor** — 代码编辑器

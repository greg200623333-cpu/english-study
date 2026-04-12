# English Study - SSA 战略勤务局

> 一个基于 **Cyberpunk 军事指挥部** 风格的英语学习系统，将刷题行为转化为战术行动，通过 AI 辅助和真题档案实现高效备考。

## 📋 项目简介

English Study 是一个面向 **CET-4/6** 和**考研英语**的智能学习平台，采用独特的"国家经营"隐喻：

- **SSA 战略勤务局** — 核心指挥中心，管理学习模式、法案系统、技能平衡
- **作战部署台 (OPS)** — 科目练习入口，支持真题档案与 AI 模拟题
- **词汇国库** — 词汇管理系统，分层记忆与复习机制
- **作文战场** — AI 辅助写作与评分反馈
- **算法阅读工作台** — 计算机科学专项阅读训练

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
| **DeepSeek API** | - | AI 题目生成与作文评分 |
| **ECharts** | 6.0.0 | 数据可视化 |
| **Monaco Editor** | 4.6.0 | 代码编辑器（算法阅读） |

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

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_BASE=https://api.deepseek.com/v1

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
│   │   ├── dashboard/        # 仪表盘
│   │   ├── quiz/             # 作战部署台
│   │   ├── ops/deploy/       # 任务部署页
│   │   ├── ssa/              # SSA 战略勤务局
│   │   ├── words/            # 词汇国库
│   │   ├── essay/            # 作文战场
│   │   └── profile/          # 个人档案
│   ├── api/                  # API 路由
│   │   ├── auth/             # 认证接口
│   │   ├── generate/         # AI 生成接口
│   │   └── study-mode/       # 学习模式接口
│   └── cs/                   # 计算机科学专项
│       └── algorithm-reading/
├── components/               # React 组件
│   ├── study-mode/           # 学习模式组件
│   │   ├── MissionBriefingModal.tsx
│   │   ├── SsaCommandCenter.tsx
│   │   └── VocabularyTreasury.tsx
│   └── portal/               # Portal 工作台组件
├── config/                   # 配置文件
│   └── subjects.ts           # 科目配置（单一数据源）
├── stores/                   # Zustand 状态管理
│   ├── useStudyModeStore.ts  # 学习模式状态
│   └── useMissionStore.ts    # 任务配置状态
├── lib/                      # 工具库
│   ├── auth.ts               # 认证逻辑
│   ├── supabase.ts           # Supabase 客户端
│   └── studyModePersistence.ts
├── supabase/                 # 数据库 Schema
│   └── schema.sql
└── public/                   # 静态资源
```

---

## 🎯 核心功能

### 1. SSA 战略勤务局

- **学习模式选择** — CET-4/6、考研英语一/二
- **法案系统** — 晨读、赤字冻结、夜间复习、专注预算
- **技能平衡** — 听说读写四维雷达图
- **行政力与赤字** — 游戏化学习进度管理

### 2. 作战部署台 (OPS)

- **科目列表** — 从 `config/subjects.ts` 读取，支持 CET/考研全科目
- **任务准备简报** — 点击科目弹出模态框，选择：
  - **推演模式** — 真题模式 / AI 模式
  - **档案选择** — 历年真题档案（如 2024.06-01）
  - **难度协议** — Standard / Hard / Elite
- **执行部署** — 跳转到 `/ops/deploy/[subjectId]`，再进入练习

### 3. AI 辅助功能

- **题目生成** — 基于 DeepSeek API 动态生成模拟题
- **作文评分** — AI 自动批改，给出分数与改进建议
- **智能推荐** — 根据答题记录推荐薄弱环节

### 4. 词汇国库

- **分层管理** — Core / Full 词汇分级
- **记忆状态** — New / Learning / Known
- **复习机制** — 基于遗忘曲线的智能复习

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
  - true → 调用 /api/generate/questions (DeepSeek)
  - false → 从 Supabase questions 表读取真题
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
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_BASE=https://api.deepseek.com/v1
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
- **状态隔离** — Zustand store 按职责分离（`useStudyModeStore` / `useMissionStore`）

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

## 📄 License

MIT

---

## 🙏 致谢

- **DeepSeek** — AI 题目生成与作文评分
- **Supabase** — 后端即服务
- **Vercel** — 部署平台
- **Tailwind CSS** — 样式系统
- **Framer Motion** — 动画库

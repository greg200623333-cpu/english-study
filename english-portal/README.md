# English Learning Portal

基于 **React 18 + Vite + Tailwind CSS + Framer Motion** 的专业英语学习平台，集成 DeepSeek AI 图像生成能力。

## ✨ 功能特性

### 🎯 双专业工作区

1. **计算机科学工作区**
   - Monaco Editor 暗黑只读模式
   - 展示 C 语言官方技术文档（ISO/IEC 9899:2018）
   - 侧边栏导航：指针、结构体、文件 I/O、标准库等
   - 专业代码高亮与语法提示

2. **建筑学工作区**
   - 10+ 建筑专业术语（飞扶壁、圆形天窗、悬臂结构等）
   - 点击术语 → AI 自动生成逼真建筑实景照片
   - DeepSeek API 驱动的图像生成
   - 优雅的 Loading 动画与错误处理

### 🎨 视觉交互

- **全屏欢迎页**：两个带悬浮发光动效的专业卡片
- **平滑转场**：Framer Motion 驱动的页面切换动画
- **响应式设计**：适配桌面与移动端
- **现代 UI**：Glassmorphism 玻璃态设计 + 渐变光晕

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd english-portal
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

已预配置 DeepSeek API Key，可直接使用。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001

### 4. 构建生产版本

```bash
npm run build
npm run preview  # 预览构建产物
```

---

## 📁 项目结构

```
english-portal/
├── src/
│   ├── components/
│   │   ├── WelcomeScreen.tsx          # 欢迎页（双卡片选择）
│   │   ├── ComputerWorkspace.tsx      # 计算机工作区（Monaco Editor）
│   │   └── ArchitectureWorkspace.tsx  # 建筑工作区（AI 图像生成）
│   ├── services/
│   │   └── imageGeneration.ts         # DeepSeek API 封装
│   ├── App.tsx                        # 主应用路由
│   ├── main.tsx                       # 入口文件
│   └── index.css                      # 全局样式
├── public/                            # 静态资源
├── .env.local                         # 本地环境变量（已配置）
├── .env.example                       # 环境变量模板
├── DEPLOY.md                          # 阿里云部署指南
├── vite.config.ts                     # Vite 配置
├── tailwind.config.js                 # Tailwind CSS 配置
└── package.json                       # 依赖清单
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| Vite | 5.3.4 | 构建工具 |
| TypeScript | 5.5.3 | 类型安全 |
| Tailwind CSS | 3.4.6 | 样式框架 |
| Framer Motion | 11.3.0 | 动画库 |
| Monaco Editor | 4.6.0 | 代码编辑器 |
| OpenAI SDK | 4.52.0 | DeepSeek API 客户端 |
| Axios | 1.7.2 | HTTP 请求 |

---

## 🎯 核心功能实现

### 1. 欢迎页动效

```typescript
// WelcomeScreen.tsx
<motion.div
  whileHover={{
    scale: 1.06,
    boxShadow: `0 0 60px ${card.glow}`,
  }}
  onClick={() => onSelect(card.id)}
>
  {/* 卡片内容 */}
</motion.div>
```

### 2. Monaco Editor 配置

```typescript
// ComputerWorkspace.tsx
<Editor
  language="c"
  theme="vs-dark"
  value={DOC_CONTENT[activeSection]}
  options={{
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 14,
  }}
/>
```

### 3. DeepSeek 图像生成

```typescript
// imageGeneration.ts
const deepseek = new OpenAI({
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const response = await deepseek.images.generate({
  model: 'dall-e-3',
  prompt: `Photorealistic ${term} architecture`,
  response_format: 'b64_json',
})

return {
  dataUrl: `data:image/png;base64,${response.data[0].b64_json}`,
}
```

---

## 🌐 阿里云部署

详见 [DEPLOY.md](./DEPLOY.md)，包含：

- **方案 A**：OSS + CDN 静态托管（推荐，成本低）
- **方案 B**：ECS + Nginx（需要后端服务）
- API Key 安全保护（后端代理方案）
- RDS 数据库集成
- CI/CD 自动化部署

---

## 🔐 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `VITE_DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 |
| `VITE_DEEPSEEK_BASE_URL` | ✅ | API 基础地址 |
| `VITE_API_BASE_URL` | ❌ | 后端 API 地址（如有） |
| `VITE_OSS_BUCKET` | ❌ | 阿里云 OSS Bucket 名称 |
| `VITE_OSS_REGION` | ❌ | OSS 区域（如 oss-cn-hangzhou） |

---

## 📝 开发注意事项

### 1. API Key 安全

**当前方案**：API Key 硬编码在前端（仅用于开发/演示）

**生产环境**：务必使用后端代理，避免 API Key 泄漏。详见 `DEPLOY.md` 第三章。

### 2. 图像生成限制

- DeepSeek 当前主要提供文本生成能力
- 图像生成接口使用 OpenAI SDK 兼容格式
- 如需真实图片生成，可切换为：
  - OpenAI DALL-E 3
  - 阿里云 DashScope wanx 模型（见 `imageGeneration.ts` 注释）

### 3. Monaco Editor 性能

- 文档内容较长时，建议启用虚拟滚动
- 移动端可考虑使用轻量级代码高亮库（如 Prism.js）

---

## 🎓 适用场景

- 计算机设计大赛作品展示
- 专业英语学习平台
- AIGC 技术集成演示
- 前端工程化最佳实践

---

## 📄 License

MIT

---

## 🙏 致谢

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [DeepSeek AI](https://www.deepseek.com/)

# 阿里云部署指南

本项目是基于 **React 18 + Vite + Tailwind CSS + Framer Motion** 的单页应用，集成 DeepSeek AI 图像生成能力。以下是完整的阿里云部署方案。

---

## 📦 一、本地构建

### 1. 安装依赖

```bash
cd english-portal
npm install
```

### 2. 配置生产环境变量

创建 `.env.production` 文件：

```bash
# DeepSeek API（必填）
VITE_DEEPSEEK_API_KEY=sk-1e7d05ebfdd3466aa0296e479842d0c7
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

# 后端 API 地址（如果有后端服务）
# 示例：VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_BASE_URL=https://your-backend-api.com
```

### 3. 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录，包含：
- `index.html` - 入口 HTML
- `assets/` - JS/CSS/字体等静态资源

---

## 🚀 二、阿里云部署方案

### 方案 A：阿里云 OSS + CDN（推荐，纯静态托管）

**适用场景**：纯前端应用，无需后端服务器，成本最低。

#### 步骤：

1. **创建 OSS Bucket**
   - 登录阿里云控制台 → 对象存储 OSS
   - 创建 Bucket（如 `english-portal`），区域选择离用户最近的（如华东1-杭州）
   - 访问权限：**公共读**

2. **上传构建产物**
   ```bash
   # 安装阿里云 CLI（可选）
   npm install -g @alicloud/cli
   
   # 或使用 OSS 控制台直接上传 dist/ 目录下所有文件
   ```

3. **配置静态网站托管**
   - Bucket 设置 → 静态页面 → 开启
   - 默认首页：`index.html`
   - 默认 404 页：`index.html`（SPA 路由必须）

4. **绑定自定义域名（可选）**
   - 域名管理 → 绑定域名 → 添加 CNAME 记录
   - 开启 CDN 加速（推荐）

5. **访问地址**
   ```
   http://english-portal.oss-cn-hangzhou.aliyuncs.com
   或
   https://yourdomain.com（绑定域名后）
   ```

**成本估算**：
- OSS 存储：0.12 元/GB/月
- CDN 流量：0.24 元/GB（国内）
- 月成本约 5-20 元（小流量）

---

### 方案 B：阿里云 ECS + Nginx

**适用场景**：需要后端服务、数据库、或更灵活的服务器控制。

#### 步骤：

1. **购买 ECS 实例**
   - 配置：1核2GB（入门级）或 2核4GB（推荐）
   - 操作系统：Ubuntu 22.04 LTS
   - 带宽：1-5 Mbps

2. **安装 Nginx**
   ```bash
   ssh root@your-ecs-ip
   apt update && apt install -y nginx
   ```

3. **上传构建产物**
   ```bash
   # 本地执行
   scp -r dist/* root@your-ecs-ip:/var/www/english-portal/
   ```

4. **配置 Nginx**
   ```bash
   vim /etc/nginx/sites-available/english-portal
   ```

   写入以下配置：
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;  # 或 ECS 公网 IP
       root /var/www/english-portal;
       index index.html;

       # SPA 路由支持：所有请求都返回 index.html
       location / {
           try_files $uri $uri/ /index.html;
       }

       # 静态资源缓存
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Gzip 压缩
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
   }
   ```

5. **启用站点并重启 Nginx**
   ```bash
   ln -s /etc/nginx/sites-available/english-portal /etc/nginx/sites-enabled/
   nginx -t  # 测试配置
   systemctl restart nginx
   ```

6. **配置 HTTPS（推荐）**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com
   ```

**成本估算**：
- ECS 1核2GB：约 60 元/月
- 带宽 1Mbps：约 23 元/月
- 月成本约 80-150 元

---

## 🔐 三、安全最佳实践

### 1. API Key 保护

**当前方案**：API Key 硬编码在前端（`dangerouslyAllowBrowser: true`）

**风险**：用户可在浏览器 DevTools 中看到 API Key，可能被滥用。

**生产推荐方案**：

#### 方案 1：后端代理（最安全）

```
前端 → 阿里云 ECS 后端 → DeepSeek API
```

**实现步骤**：

1. 在 ECS 上部署 Node.js 后端（Express/Koa）
2. 后端代码：
   ```javascript
   // server.js
   const express = require('express')
   const OpenAI = require('openai')
   const app = express()

   const deepseek = new OpenAI({
     apiKey: process.env.DEEPSEEK_API_KEY,  // 从环境变量读取
     baseURL: 'https://api.deepseek.com',
   })

   app.post('/api/generate-image', async (req, res) => {
     const { term } = req.body
     const result = await deepseek.images.generate({
       model: 'dall-e-3',
       prompt: `Photorealistic ${term} architecture`,
       size: '1024x1024',
       response_format: 'b64_json',
     })
     res.json({ dataUrl: `data:image/png;base64,${result.data[0].b64_json}` })
   })

   app.listen(8000)
   ```

3. 前端修改 `imageGeneration.ts`：
   ```typescript
   import axios from 'axios'

   export async function generateArchitectureImage(term: string) {
     const res = await axios.post('/api/generate-image', { term })
     return res.data
   }
   ```

4. Nginx 配置反向代理：
   ```nginx
   location /api/ {
       proxy_pass http://localhost:8000/;
   }
   ```

#### 方案 2：阿里云 Serverless（函数计算）

使用阿里云函数计算（FC）作为中间层：

```
前端 → 阿里云 FC → DeepSeek API
```

优点：按调用次数计费，无需维护服务器。

---

### 2. 环境变量管理

**开发环境**：`.env.local`（已在 `.gitignore` 中）

**生产环境**：
- OSS 方案：构建时注入（`npm run build` 前设置）
- ECS 方案：使用 `pm2` 或 `systemd` 管理环境变量

```bash
# 示例：使用 pm2
pm2 start server.js --name english-api --env production
```

---

## 🗄️ 四、阿里云数据库集成

如果后续需要存储用户数据（学习记录、生成历史等），推荐使用：

### 1. 阿里云 RDS（MySQL/PostgreSQL）

**配置示例**：
```javascript
// 后端连接 RDS
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: 'rm-xxxxx.mysql.rds.aliyuncs.com',  // RDS 内网地址
  user: 'admin',
  password: process.env.DB_PASSWORD,
  database: 'english_study',
  waitForConnections: true,
  connectionLimit: 10,
})

// 保存生成记录
app.post('/api/save-generation', async (req, res) => {
  const { term, imageUrl } = req.body
  await pool.execute(
    'INSERT INTO generations (term, image_url, created_at) VALUES (?, ?, NOW())',
    [term, imageUrl]
  )
  res.json({ success: true })
})
```

### 2. 阿里云 TableStore（NoSQL）

适合高并发、海量数据场景。

---

## 📊 五、监控与日志

### 1. 阿里云 SLS（日志服务）

收集 Nginx 访问日志、应用错误日志：

```bash
# 安装 Logtail
wget http://logtail-release-cn-hangzhou.oss-cn-hangzhou.aliyuncs.com/linux64/logtail.sh
sh logtail.sh install cn-hangzhou
```

### 2. 阿里云 ARMS（应用监控）

前端性能监控、错误追踪：

```html
<!-- 在 index.html 中添加 -->
<script src="https://retcode.alicdn.com/retcode/bl.js"></script>
<script>
  __bl.setConfig({
    pid: 'your-arms-pid',
    appType: 'web',
  })
</script>
```

---

## 🔄 六、CI/CD 自动化部署

### 使用 GitHub Actions + 阿里云 OSS

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Aliyun OSS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install & Build
        run: |
          npm install
          npm run build
        env:
          VITE_DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
      
      - name: Upload to OSS
        uses: fangbinwei/aliyun-oss-website-action@v1
        with:
          accessKeyId: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          accessKeySecret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
          bucket: english-portal
          endpoint: oss-cn-hangzhou.aliyuncs.com
          folder: dist
```

---

## 📝 七、快速启动命令

```bash
# 1. 克隆项目
git clone <your-repo>
cd english-portal

# 2. 安装依赖
npm install

# 3. 本地开发
npm run dev
# 访问 http://localhost:3001

# 4. 生产构建
npm run build

# 5. 预览构建产物
npm run preview
```

---

## 🆘 常见问题

### Q1: 部署后页面刷新 404？
**A**: SPA 路由问题，确保 Nginx 配置了 `try_files $uri /index.html` 或 OSS 开启了静态网站托管。

### Q2: API Key 泄漏怎么办？
**A**: 立即在 DeepSeek 控制台撤销旧 Key，生成新 Key，并迁移到后端代理方案。

### Q3: 图像生成失败？
**A**: 检查：
1. DeepSeek API Key 是否有效
2. 网络是否能访问 `api.deepseek.com`
3. 浏览器控制台是否有 CORS 错误（需后端代理）

### Q4: 如何优化加载速度？
**A**: 
- 开启 CDN 加速
- 启用 Gzip/Brotli 压缩
- 使用 `vite-plugin-compression` 预压缩资源
- 图片使用 WebP 格式

---

## 📞 技术支持

- DeepSeek API 文档：https://platform.deepseek.com/docs
- 阿里云 OSS 文档：https://help.aliyun.com/product/31815.html
- Vite 部署指南：https://vitejs.dev/guide/static-deploy.html

---

**祝部署顺利！🎉**

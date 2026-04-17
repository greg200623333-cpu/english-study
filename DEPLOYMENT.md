# Next.js Standalone 部署指南

## 📦 部署架构

```
项目根目录 (/www/wwwroot/english-study)
├── deploy/                    # 部署目录（运行时）
│   ├── server.js             # Next.js 服务器入口
│   ├── .next/
│   │   ├── static/           # 静态资源（JS/CSS）
│   │   └── ...               # 其他构建文件
│   ├── public/               # 公共资源（图片等）
│   ├── .env.production       # 环境变量
│   ├── ecosystem.config.js   # PM2 配置
│   └── logs/                 # 日志目录
├── backups/                  # 自动备份目录
├── deploy-server.sh          # 部署脚本
├── rollback.sh               # 回滚脚本
└── ecosystem.config.js       # PM2 配置模板
```

## 🚀 快速部署

### 1. 首次部署

在服务器上执行：

```bash
cd /www/wwwroot/english-study

# 拉取最新代码
git pull origin main

# 执行部署脚本
bash deploy-server.sh
```

### 2. 更新部署

```bash
cd /www/wwwroot/english-study
git pull origin main
bash deploy-server.sh
```

### 3. 回滚到上一版本

```bash
cd /www/wwwroot/english-study
bash rollback.sh
```

## 📋 部署脚本功能

`deploy-server.sh` 自动执行以下步骤：

1. ✅ 环境检查（pnpm、node、pm2）
2. 💾 备份当前部署（保留最近 5 个备份）
3. 🧹 清理旧构建
4. 📦 安装依赖
5. 🔨 构建生产版本
6. 📁 准备部署文件（复制 standalone、static、public）
7. ✔️ 验证部署文件
8. 🛑 停止旧服务
9. 🚀 启动新服务
10. 🏥 健康检查

## ⚙️ PM2 配置说明

`ecosystem.config.js` 配置项：

- **应用名称**: `ssa-app`
- **运行模式**: cluster（集群模式）
- **内存限制**: 1GB 自动重启
- **日志路径**: `./logs/`
- **环境变量**: 从 `.env.production` 加载

## 🔧 环境变量配置

编辑 `.env.production` 文件：

```bash
nano /www/wwwroot/english-study/deploy/.env.production
```

必需的环境变量：

```env
# 数据库
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API
DEEPSEEK_API_KEY=your_deepseek_key
ANTHROPIC_API_KEY=your_anthropic_key
DOUBAO_API_KEY=your_doubao_key
DOUBAO_ENDPOINT_ID=your_endpoint_id
YOUDAO_APP_KEY=your_youdao_key
YOUDAO_APP_SECRET=your_youdao_secret

# 安全
SESSION_SECRET=your_session_secret
PASSWORD_SALT=your_password_salt
COOKIE_SECURE=false
```

生成随机密钥：

```bash
# 生成 SESSION_SECRET
openssl rand -base64 32

# 生成 PASSWORD_SALT
openssl rand -base64 16
```

## 🔍 常用命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs ssa-app

# 查看最近 100 行日志
pm2 logs ssa-app --lines 100

# 重启服务
pm2 restart ssa-app

# 停止服务
pm2 stop ssa-app

# 删除服务
pm2 delete ssa-app

# 查看详细信息
pm2 show ssa-app

# 监控资源使用
pm2 monit
```

## 🐛 故障排查

### 1. 服务启动失败

```bash
# 查看错误日志
pm2 logs ssa-app --err --lines 50

# 手动启动测试
cd /www/wwwroot/english-study/deploy
NODE_ENV=production node server.js
```

### 2. 静态资源 404

检查目录结构：

```bash
ls -la /www/wwwroot/english-study/deploy/.next/static
ls -la /www/wwwroot/english-study/deploy/public
```

### 3. 环境变量未生效

```bash
# 检查环境变量文件
cat /www/wwwroot/english-study/deploy/.env.production

# 重启服务
pm2 restart ssa-app --update-env
```

### 4. 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 3000

# 或使用 lsof
lsof -i :3000
```

## 📊 静态资源优化

### Standalone 模式下的静态资源路径

Next.js Standalone 模式会自动处理静态资源路径：

1. **`/_next/static/*`** - 由 Next.js 服务器提供
2. **`/public/*`** - 映射到 `deploy/public/` 目录

确保部署脚本正确复制了这些目录：

```bash
deploy/
├── .next/static/    # ✅ 必须存在
└── public/          # ✅ 必须存在
```

### Nginx 优化（可选）

如果使用 Nginx 反向代理，可以让 Nginx 直接托管静态文件：

```nginx
# 静态资源缓存
location /_next/static {
    alias /www/wwwroot/english-study/deploy/.next/static;
    expires 365d;
    access_log off;
    add_header Cache-Control "public, immutable";
}

location /public {
    alias /www/wwwroot/english-study/deploy/public;
    expires 30d;
    access_log off;
}

# 其他请求代理到 Node.js
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 🔐 安全建议

1. **HTTPS**: 生产环境启用 HTTPS，设置 `COOKIE_SECURE=true`
2. **防火墙**: 只开放 80/443 端口，3000 端口仅本地访问
3. **环境变量**: 不要将 `.env.production` 提交到 Git
4. **定期更新**: 定期更新依赖和 Node.js 版本

## 📈 性能监控

```bash
# PM2 监控面板
pm2 monit

# 查看内存使用
pm2 show ssa-app | grep memory

# 查看 CPU 使用
pm2 show ssa-app | grep cpu
```

## 🆘 紧急回滚

如果新版本有问题，立即回滚：

```bash
bash /www/wwwroot/english-study/rollback.sh
```

## 📞 支持

遇到问题请检查：
1. PM2 日志: `pm2 logs ssa-app`
2. Nginx 日志: `/var/log/nginx/error.log`
3. 系统日志: `journalctl -u nginx -f`

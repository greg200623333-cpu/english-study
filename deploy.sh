#!/bin/bash

# Next.js Standalone 部署脚本
# 用于阿里云服务器部署

echo "开始构建..."
pnpm build

echo "准备部署文件..."

# 创建部署目录
mkdir -p deploy

# 复制 standalone 服务器
cp -r .next/standalone/* deploy/

# 复制静态资源到正确位置
mkdir -p deploy/.next
cp -r .next/static deploy/.next/static

# 复制 public 文件
cp -r public deploy/public

# 复制环境变量文件（如果存在）
if [ -f .env.production ]; then
  cp .env.production deploy/.env.production
fi

echo "部署文件准备完成！"
echo "请将 deploy 目录上传到服务器"
echo ""
echo "服务器上运行："
echo "  cd /path/to/deploy"
echo "  NODE_ENV=production node server.js"

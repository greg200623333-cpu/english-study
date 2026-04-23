#!/bin/bash



echo "开始构建..."
pnpm build

echo "准备部署文件..."


mkdir -p deploy


cp -r .next/standalone/* deploy/


mkdir -p deploy/.next
cp -r .next/static deploy/.next/static


cp -r public deploy/public


if [ -f .env.production ]; then
  cp .env.production deploy/.env.production
fi

echo "部署文件准备完成！"
echo "请将 deploy 目录上传到服务器"
echo ""
echo "服务器上运行："
echo "  cd /path/to/deploy"
echo "  NODE_ENV=production node server.js"

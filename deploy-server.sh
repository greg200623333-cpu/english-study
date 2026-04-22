#!/bin/bash

###############################################################################
# Next.js Standalone 自动部署脚本
# 用途: 在阿里云服务器上自动部署 Next.js 应用
# 使用: bash deploy-server.sh [--clean]
# 选项: --clean 强制清除所有缓存（解决更新不生效问题）
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

###############################################################################
# 配置变量
###############################################################################

PROJECT_DIR="/www/wwwroot/english-study"
APP_NAME="ssa-app"
DEPLOY_DIR="${PROJECT_DIR}/deploy"
BACKUP_DIR="${PROJECT_DIR}/backups"

# 检查是否使用 --clean 参数
CLEAN_BUILD=false
if [[ "$1" == "--clean" ]]; then
    CLEAN_BUILD=true
    echo_warn "使用 --clean 模式，将清除所有缓存"
fi

###############################################################################
# 1. 检查环境
###############################################################################

echo_info "开始部署 ${APP_NAME}..."

# 检查是否在项目目录
if [ ! -f "${PROJECT_DIR}/package.json" ]; then
    echo_error "未找到 package.json，请确认在项目根目录执行"
    exit 1
fi

cd "${PROJECT_DIR}"

# 检查必要命令
for cmd in pnpm node pm2; do
    if ! command -v $cmd &> /dev/null; then
        echo_error "$cmd 未安装，请先安装"
        exit 1
    fi
done

###############################################################################
# 2. 备份当前部署（如果存在）
###############################################################################

if [ -d "${DEPLOY_DIR}" ]; then
    echo_info "备份当前部署..."
    mkdir -p "${BACKUP_DIR}"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" -C "${PROJECT_DIR}" deploy 2>/dev/null || true
    echo_info "备份已保存到: ${BACKUP_DIR}/${BACKUP_NAME}"

    # 只保留最近 5 个备份
    cd "${BACKUP_DIR}"
    ls -t backup-*.tar.gz | tail -n +6 | xargs -r rm
    cd "${PROJECT_DIR}"
fi

###############################################################################
# 3. 清理旧构建
###############################################################################

echo_info "清理旧构建..."
rm -rf .next deploy

# 如果使用 --clean 参数，清除所有缓存
if [ "$CLEAN_BUILD" = true ]; then
    echo_info "清除所有缓存（--clean 模式）..."
    rm -rf node_modules/.cache
    rm -rf .next/cache
    pnpm store prune || true
    echo_info "缓存已清除"
fi

###############################################################################
# 4. 安装依赖
###############################################################################

echo_info "安装依赖..."
pnpm install --frozen-lockfile

###############################################################################
# 5. 加载环境变量并构建生产版本
###############################################################################

echo_info "加载环境变量..."

# 检查 .env.production 是否存在
if [ ! -f ".env.production" ]; then
    echo_error ".env.production 文件不存在，无法构建"
    exit 1
fi

# 读取并导出环境变量（过滤注释和空行）
set -a  # 自动导出所有变量
source <(grep -v '^#' .env.production | grep -v '^$' | sed 's/\r$//')
set +a  # 关闭自动导出

# 验证关键环境变量
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo_error "关键环境变量缺失，请检查 .env.production"
    exit 1
fi

echo_info "环境变量已加载"
echo_info "SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."

echo_info "开始构建生产版本..."
NODE_ENV=production pnpm build

# 检查构建是否成功
if [ ! -d ".next/standalone" ]; then
    echo_error "构建失败：未找到 .next/standalone 目录"
    exit 1
fi

###############################################################################
# 6. 准备部署目录
###############################################################################

echo_info "准备部署文件..."

# 创建部署目录
mkdir -p "${DEPLOY_DIR}/.next"

# 复制 standalone 服务器文件
echo_info "复制 standalone 文件..."
cp -r .next/standalone/* "${DEPLOY_DIR}/"
cp -r .next/standalone/.next "${DEPLOY_DIR}/"

# 复制静态资源
echo_info "复制静态资源..."
cp -r .next/static "${DEPLOY_DIR}/.next/static"

# 复制 public 文件
if [ -d "public" ]; then
    echo_info "复制 public 文件..."
    cp -r public "${DEPLOY_DIR}/public"
fi

# 复制环境变量文件
if [ -f ".env.production" ]; then
    echo_info "复制环境变量文件..."
    cp .env.production "${DEPLOY_DIR}/.env.production"
else
    echo_warn ".env.production 不存在，请手动创建"
fi

# 复制 PM2 配置
if [ -f "ecosystem.config.js" ]; then
    cp ecosystem.config.js "${DEPLOY_DIR}/"
fi

###############################################################################
# 7. 验证部署文件
###############################################################################

echo_info "验证部署文件..."

REQUIRED_FILES=(
    "${DEPLOY_DIR}/server.js"
    "${DEPLOY_DIR}/.next/static"
    "${DEPLOY_DIR}/public"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        echo_error "缺少必要文件: $file"
        exit 1
    fi
done

echo_info "部署文件验证通过"

###############################################################################
# 8. 停止旧服务并清理端口
###############################################################################

echo_info "停止旧服务..."
pm2 stop ${APP_NAME} 2>/dev/null || echo_warn "未找到运行中的 ${APP_NAME}"
pm2 delete ${APP_NAME} 2>/dev/null || true

# 强制清理 3000 端口占用
echo_info "清理 3000 端口占用..."
fuser -k 3000/tcp 2>/dev/null || true
sleep 2  # 等待进程完全退出

###############################################################################
# 9. 启动新服务
###############################################################################

echo_info "启动新服务..."
cd "${DEPLOY_DIR}"

if [ -f "ecosystem.config.js" ]; then
    # 使用 PM2 配置文件启动
    pm2 start ecosystem.config.js
else
    # 直接启动
    pm2 start server.js --name ${APP_NAME} \
        --node-args="--max-old-space-size=2048" \
        --env production
fi

# 保存 PM2 配置
pm2 save

###############################################################################
# 10. 健康检查
###############################################################################

echo_info "等待服务启动..."
sleep 5

# 检查服务状态
if pm2 list | grep -q "${APP_NAME}.*online"; then
    echo_info "✓ 服务启动成功"

    # 测试 HTTP 响应
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo_info "✓ HTTP 健康检查通过"
    else
        echo_warn "HTTP 健康检查失败，请检查日志"
    fi
else
    echo_error "✗ 服务启动失败"
    pm2 logs ${APP_NAME} --lines 50
    exit 1
fi

###############################################################################
# 11. 显示部署信息
###############################################################################

echo ""
echo_info "=========================================="
echo_info "部署完成！"
echo_info "=========================================="
echo_info "应用名称: ${APP_NAME}"
echo_info "部署目录: ${DEPLOY_DIR}"
echo_info "访问地址: http://localhost:3000"
echo ""
echo_info "常用命令:"
echo "  查看日志: pm2 logs ${APP_NAME}" 
echo "  查看状态: pm2 status"
echo "  重启服务: pm2 restart ${APP_NAME}"
echo "  停止服务: pm2 stop ${APP_NAME}"
echo ""
echo_info "如需回滚，运行: bash rollback.sh"
echo_info "=========================================="

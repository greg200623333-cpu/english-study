#!/bin/bash

###############################################################################
# 回滚脚本
# 用途: 快速回滚到上一个备份版本
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

PROJECT_DIR="/www/wwwroot/english-study"
BACKUP_DIR="${PROJECT_DIR}/backups"
DEPLOY_DIR="${PROJECT_DIR}/deploy"
APP_NAME="ssa-app"

cd "${PROJECT_DIR}"

# 检查备份目录
if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A ${BACKUP_DIR})" ]; then
    echo_error "没有可用的备份"
    exit 1
fi

# 列出可用备份
echo_info "可用的备份:"
ls -lht "${BACKUP_DIR}"/backup-*.tar.gz | nl

# 选择最新备份
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/backup-*.tar.gz | head -1)

echo ""
read -p "是否回滚到最新备份 $(basename ${LATEST_BACKUP})? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_info "取消回滚"
    exit 0
fi

# 停止服务
echo_info "停止服务..."
pm2 stop ${APP_NAME} || true

# 删除当前部署
echo_info "删除当前部署..."
rm -rf "${DEPLOY_DIR}"

# 解压备份
echo_info "恢复备份..."
tar -xzf "${LATEST_BACKUP}" -C "${PROJECT_DIR}"

# 重启服务
echo_info "重启服务..."
cd "${DEPLOY_DIR}"
pm2 start ecosystem.config.js || pm2 start server.js --name ${APP_NAME}

echo_info "回滚完成！"
pm2 logs ${APP_NAME} --lines 20

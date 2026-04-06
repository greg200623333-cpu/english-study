import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    // 开发环境代理：将 /api 请求转发到后端服务
    // 阿里云部署时，后端地址改为实际 ECS 内网 IP 或域名
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // 阿里云 OSS 静态托管时，确保资源路径正确
    assetsDir: 'assets',
    sourcemap: false,
  },
})

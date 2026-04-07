import axios from 'axios'

/*
  Vite 环境可在 `.env`, `.env.development`, `.env.production` 中配置：

  VITE_API_BASE_URL=https://your-ecs-domain-or-ip/api

  生产部署到阿里云 ECS 时：
  1. 在 ECS 上配置 Nginx / API 网关转发到应用服务。
  2. 前端构建时通过 Vite 注入 `import.meta.env.VITE_API_BASE_URL`。
  3. 不要把密钥写死在前端仓库；只暴露公开 API 基地址。

  当前项目是 Next.js，如在本仓库直接使用，可额外在 `.env.local` 中同步一份：

  NEXT_PUBLIC_API_BASE_URL=https://your-ecs-domain-or-ip/api

  JWT 建议：
  1. 登录成功后把 access token 存入 HttpOnly Cookie，优先避免 localStorage 暴露。
  2. 若业务必须在前端读取 token，可短期放在内存态，并通过 refresh token 刷新。
  3. Axios 请求拦截器统一挂载 `Authorization: Bearer <token>`。
  4. 响应拦截器在 401 时触发刷新逻辑或跳转登录，保证战略进度、法案状态、
     学习记录能安全同步到阿里云数据库。
*/

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('study_mode_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
    }

    return Promise.reject(error)
  }
)

export default api

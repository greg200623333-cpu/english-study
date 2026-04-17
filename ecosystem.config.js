module.exports = {
  apps: [
    {
      name: 'ssa-app',
      script: './server.js',
      cwd: '/www/wwwroot/english-study/deploy',

      // 实例配置
      instances: 1,
      exec_mode: 'cluster',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,

        // Supabase 配置
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

        // DeepSeek API
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',

        // Anthropic API (Claude)
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

        // 豆包 API
        DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || '',
        DOUBAO_ENDPOINT_ID: process.env.DOUBAO_ENDPOINT_ID || '',

        // 有道 API
        YOUDAO_APP_KEY: process.env.YOUDAO_APP_KEY || '',
        YOUDAO_APP_SECRET: process.env.YOUDAO_APP_SECRET || '',

        // Session 配置
        SESSION_SECRET: process.env.SESSION_SECRET || '',
        PASSWORD_SALT: process.env.PASSWORD_SALT || '',
        COOKIE_SECURE: process.env.COOKIE_SECURE || 'false',
      },

      // 从 .env.production 文件加载环境变量
      env_file: '.env.production',

      // 日志配置
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // 进程管理
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,

      // Node.js 参数
      node_args: '--max-old-space-size=2048',

      // 启动延迟
      listen_timeout: 10000,
      kill_timeout: 5000,

      // 优雅重启
      wait_ready: true,

      // 环境特定配置
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      env_staging: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],

  // 部署配置（可选）
  deploy: {
    production: {
      user: 'root',
      host: '39.106.99.34',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/english-study.git',
      path: '/www/wwwroot/english-study',
      'post-deploy': 'bash deploy-server.sh && pm2 reload ecosystem.config.js',
    },
  },
}

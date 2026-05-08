module.exports = {
  apps: [
    {
      name: 'ssa-app',
      script: './server.js',
      cwd: '/www/wwwroot/english-study/deploy',

      instances: 1,
      exec_mode: 'cluster',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,

        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

        // DeepSeek API
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',

        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

        DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || '',
        DOUBAO_ENDPOINT_ID: process.env.DOUBAO_ENDPOINT_ID || '',

        YOUDAO_APP_KEY: process.env.YOUDAO_APP_KEY || '',
        YOUDAO_APP_SECRET: process.env.YOUDAO_APP_SECRET || '',

        SESSION_SECRET: process.env.SESSION_SECRET || '',
        PASSWORD_SALT: process.env.PASSWORD_SALT || '',
        COOKIE_SECURE: process.env.COOKIE_SECURE || 'false',
      },

      env_file: '.env.production',

      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,

      node_args: '--max-old-space-size=2048',

      listen_timeout: 10000,
      kill_timeout: 5000,

      wait_ready: true,

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

module.exports = {
  apps: [
    {
      name: 'shotforge',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 'max',        // 利用所有 CPU 核心
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      // 日志
      out_file: '/var/log/shotforge/out.log',
      error_file: '/var/log/shotforge/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 崩溃自动重启
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
}

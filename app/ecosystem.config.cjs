module.exports = {
  apps: [{
    name: "contentglowz_app",
    cwd: "/home/claude/contentglowz/app",
    script: "bash",
    args: ["-lc", "export PORT=3023 && flox activate -- bash -lc 'export API_BASE_URL=\"http://127.0.0.1:3002\" && export APP_WEB_URL=\"http://127.0.0.1:3023\" && export APP_SITE_URL=\"http://127.0.0.1:3023\" && doppler run --project contentglowz_app --config prd -- ./pm2-web.sh'"],
    env: {
      PORT: 3023
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};

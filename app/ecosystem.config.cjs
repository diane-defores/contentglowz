module.exports = {
  apps: [{
    name: "contentglowz_app",
    cwd: "/home/claude/contentglowz/app",
    script: "bash",
    args: ["-lc", "export PORT=3023 && flox activate -- bash -lc 'export CONTENTGLOWZ_DEVSERVER_API_BASE_URL=\"http://localhost:3002\" && export CONTENTGLOWZ_DEVSERVER_APP_WEB_URL=\"http://localhost:3023\" && export CONTENTGLOWZ_DEVSERVER_SITE_URL=\"http://localhost:3023\" && export BUILD_ENVIRONMENT=development && export CONTENTGLOWZ_DEV_AUTH_BYPASS=true && doppler run --project contentglowz_app --config dev -- ./pm2-web.sh'"],
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

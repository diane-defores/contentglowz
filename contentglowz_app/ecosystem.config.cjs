module.exports = {
  apps: [{
    name: "contentglowz_app",
    cwd: "/home/claude/contentglowz/contentglowz_app",
    script: "bash",
    args: ["-lc", "export PORT=3011 && flox activate -- doppler run -- bash -lc 'env PORT=3011 ./pm2-web.sh'"],
    env: {
      PORT: 3011
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};

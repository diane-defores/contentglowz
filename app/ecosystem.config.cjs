module.exports = {
  apps: [{
    name: "app",
    cwd: "/home/claude/contentglowz/app",
    script: "bash",
    args: ["-lc", "export PORT=3011 && flox activate -- bash -lc 'env PORT=3011 CLERK_PUBLISHABLE_KEY=\"$CLERK_PUBLISHABLE_KEY\" ./pm2-web.sh'"],
    env: {
      PORT: 3011,
      CLERK_PUBLISHABLE_KEY: "a remplacer"
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};

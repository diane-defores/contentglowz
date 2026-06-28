module.exports = {
  apps: [{
    name: "site",
    cwd: "/home/claude/contentglowz/site",
    script: "bash",
    args: ["-lc", "export PORT=3012 && flox activate -- bash -lc 'pnpm dev --port 3012'"],
    env: {
      PORT: 3012
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};

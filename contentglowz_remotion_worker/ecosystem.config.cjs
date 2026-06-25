module.exports = {
  apps: [{
    name: "contentglowz_remotion_worker",
    cwd: "/home/claude/contentglowz/contentglowz_remotion_worker",
    script: "bash",
    args: ["-lc", "export PORT=3018 && flox activate -- bash -lc 'pnpm dev'"],
    env: {
      PORT: 3018
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};

module.exports = {
  apps: [{
    name: "lab",
    cwd: "/home/claude/contentglowz/lab",
    script: "bash",
    args: ["-lc", "export PORT=3002 && flox activate -- bash -lc 'source ./venv/bin/activate && env PORT=3002 python3 main.py'"],
    env: {
      PORT: 3002
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};

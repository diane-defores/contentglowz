module.exports = {
  apps: [{
    name: "contentglowz_lab",
    cwd: "/home/claude/contentglowz/lab",
    script: "bash",
    args: ["-lc", "export PORT=3002 && flox activate -- bash -lc 'export LD_LIBRARY_PATH=\"$(dirname \"$(gcc -print-file-name=libstdc++.so.6)\")\" && export GIT_SHA=\"$(git -C /home/claude/contentglowz rev-parse HEAD)\" && doppler run --project contentglowz_app --config prd -- .venv/bin/python main.py'"],
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

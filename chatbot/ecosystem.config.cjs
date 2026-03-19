module.exports = {
  apps: [{
    name: "my-robots",
    cwd: "/home/claude/my-robots",
    script: "bash",
    args: ["-c", "export PORT=3004 && flox activate -- doppler run -- env PORT=3004 ./venv/bin/python main.py"],
    env: {
      PORT: 3004
    },
    autorestart: true,
    watch: false
  }]
};

module.exports = {
  apps: [{
    name: "my-robots",
    cwd: "/home/claude/my-robots",
    script: "bash",
    args: ["-c", "export PORT=3002 && flox activate -- doppler run -- env PORT=3002 ./venv/bin/python main.py"],
    env: {
      PORT: 3002
    },
    autorestart: true,
    watch: false
  }]
};

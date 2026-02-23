module.exports = {
  apps: [{
    name: "my-robots",
    cwd: "/home/claude/my-robots",
    script: "bash",
    args: ["-c", "export PORT=3000 && flox activate -- ./venv/bin/python main.py"],
    env: {
      PORT: 3000
    },
    autorestart: true,
    watch: false
  }]
};

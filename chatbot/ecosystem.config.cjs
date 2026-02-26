module.exports = {
  apps: [{
    name: "my-robots",
    cwd: "/home/claude/my-robots",
    script: "bash",
    args: ["-c", "export PORT=3013 && flox activate -- doppler run -- env PORT=3013 ./venv/bin/python main.py"],
    env: {
      PORT: 3013
    },
    autorestart: true,
    watch: false
  }]
};

module.exports = {
  apps: [{
    name: "chatbot",
    cwd: "/home/claude/my-robots/chatbot",
    script: "bash",
    args: ["-c", "export PORT=3003 && flox activate -- pnpm dev -p 3003"],
    env: {
      PORT: 3003
    },
    autorestart: true,
    watch: false
  }]
};

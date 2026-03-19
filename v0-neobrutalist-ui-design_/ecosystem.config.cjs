module.exports = {
  apps: [{
    name: "v0-neobrutalist-ui-design_",
    cwd: "/home/claude/SocialFlowz/v0-neobrutalist-ui-design_",
    script: "bash",
    args: ["-c", "export PORT=3025 && flox activate -- npm run dev"],
    env: {
      PORT: 3025
    },
    autorestart: true,
    watch: false
  }]
};

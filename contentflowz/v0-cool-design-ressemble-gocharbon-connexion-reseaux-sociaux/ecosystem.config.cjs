module.exports = {
  apps: [{
    name: "v0-cool-design-ressemble-gocharbon-connexion-reseaux-sociaux",
    cwd: "/home/claude/ContentFlowz/v0-cool-design-ressemble-gocharbon-connexion-reseaux-sociaux",
    script: "bash",
    args: ["-c", "export PORT=3010 && flox activate -- npm run dev"],
    env: {
      PORT: 3010
    },
    autorestart: true,
    watch: false
  }]
};

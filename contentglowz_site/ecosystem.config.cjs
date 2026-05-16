module.exports = {
  apps: [{
    name: "contentglowz_site",
    cwd: __dirname,
    script: "bash",
    args: ["-lc", "export PORT=3001 && flox activate -- bash -lc 'npm run dev -- --port 3001'"],
    env: {
      PORT: 3001
    },
    autorestart: true,
    watch: false
  }]
};

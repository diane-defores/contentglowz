module.exports = {
  apps: [{
    name: "contentflow_site",
    cwd: "/home/ubuntu/contentflow/contentflow_site",
    script: "bash",
    args: ["-lc", "export PORT=3001 && flox activate -- bash -lc 'npm run dev -- --port 3001'"],
    env: {
      PORT: 3001
    },
    autorestart: true,
    watch: false
  }]
};

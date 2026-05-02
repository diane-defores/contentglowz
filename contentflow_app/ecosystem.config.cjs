module.exports = {
  apps: [{
    name: "contentflow_app",
    cwd: "/home/ubuntu/contentflow/contentflow_app",
    script: "bash",
    args: ["-lc", "export PORT=3050 && flox activate -- doppler run -- bash -lc 'env PORT=3050 ./pm2-web.sh'"],
    env: {
      PORT: 3050
    },
    autorestart: true,
    watch: false
  }]
};

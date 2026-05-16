module.exports = {
  apps: [{
    name: "contentglowz_lab",
    cwd: __dirname,
    script: "bash",
    args: ["-lc", "export PORT=3000 && flox activate -- doppler run -- bash -lc 'env PORT=3000 python3 main.py'"],
    env: {
      PORT: 3000
    },
    autorestart: true,
    watch: false
  }]
};

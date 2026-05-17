module.exports = {
  apps: [{
    name: "contentglowz_lab",
    cwd: "/home/claude/contentglowz/contentglowz_lab",
    script: "bash",
    args: ["-lc", "export PORT=3002 && flox activate -- doppler run --project contentflow_app --config prd -- bash -lc 'env PORT=3002 LD_LIBRARY_PATH=/nix/store/dcb4bsy8fcn51bw0qp3vwx8q0rzpghd5-gcc-15.2.0-lib/lib:/nix/store/n0ymm4jicmgvwpwmfdz15ir9wwq0lhnl-zlib-1.3.2/lib ./venv/bin/python3 main.py'"],
    env: {
      PORT: 3002
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};

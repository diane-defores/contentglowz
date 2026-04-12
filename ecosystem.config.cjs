const path = require("path");

module.exports = {
  apps: [{
    name: "contentflow-app",
    cwd: path.resolve(__dirname),
    script: "bash",
    args: ["-lc", "export PORT=3050 && flox activate -- doppler run -- bash -lc 'export PORT=3050 && export PATH=/home/claude/.flutter-sdk/bin:$PATH && flutter config --enable-web >/dev/null 2>&1 || true && flutter pub get && flutter build web --release --dart-define=API_BASE_URL=${API_BASE_URL:-https://api.winflowz.com} --dart-define=CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY:-} && if [ -f server.js ]; then node server.js 3050; else python3 -m http.server 3050 --directory build/web; fi'"],
    env: {
      PORT: 3050
    },
    autorestart: true,
    watch: false
  }]
};

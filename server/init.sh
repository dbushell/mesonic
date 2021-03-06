#!/bin/zsh
source ~/.zshrc

killall() {
  echo "SHUTDOWN"
  trap '' SIGINT SIGTERM EXIT
  kill -TERM 0
  wait
  echo "DONE"
}

trap 'killall' SIGINT SIGTERM EXIT

deno run --unstable --allow-all --import-map ~/server/imports.json ~/server/mod.js & ;

(cd ~/client && npm install)

if [[ "$MESONIC_DEV" == 1 ]]; then
  (cd ~/client && npm run dev &)
else
  (cd ~/client && npm run build && node build &)
fi

caddy run --adapter caddyfile --config ~/server/Caddyfile &

wait

#!/bin/zsh
source ~/.zshrc

deno run --unstable --allow-all --import-map ~/server/imports.json ~/server/mod.js & ;

(cd ~/client && npm install)

if [[ "$MESONIC_DEV" == 1 ]]; then
  (cd ~/client && npm run dev &)
else
  (cd ~/client && npm run build && node build &)
fi

caddy run --adapter caddyfile --config - <<EOF
{
  auto_https off
}

:4040 {
  handle /data/* {
    uri strip_prefix /data
    root * /data
    file_server
  }

  handle /rest/* {
    reverse_proxy http://localhost:8080
  }

  reverse_proxy http://localhost:3000
}
EOF

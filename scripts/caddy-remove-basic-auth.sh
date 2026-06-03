#!/bin/sh
# Remove Caddy basic auth — use app-level SMTP + admin approval instead.
set -e
tee /etc/caddy/Caddyfile << 'EOF'
api.drplant.app {
	reverse_proxy 127.0.0.1:3001
}

drplant.app, www.drplant.app {
	reverse_proxy 127.0.0.1:8080
}
EOF
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
echo "Caddy reloaded without basic auth."

#!/usr/bin/env bash
set -euo pipefail
config=/etc/nginx/sites-available/workmusic-radio
backup="${config}.before-mage-$(date -u +%Y%m%dT%H%M%SZ)"
sudo cp "$config" "$backup"
sudo install -m 644 /srv/apps/ordinary-mage/current/ops/nginx-mage.conf /etc/nginx/snippets/ordinary-mage.conf
sudo python3 - <<'PY'
from pathlib import Path
path=Path('/etc/nginx/sites-available/workmusic-radio')
text=path.read_text()
line='    include /etc/nginx/snippets/ordinary-mage.conf;\n'
anchor='    location /humaair/ {'
if line not in text:
    if text.count(anchor)!=1:
        raise SystemExit('Expected HTTPS location block not found; no changes made')
    path.write_text(text.replace(anchor,line+anchor,1))
PY
if sudo nginx -t; then
  sudo systemctl reload nginx
else
  sudo cp "$backup" "$config"
  exit 1
fi
printf 'Nginx backup: %s\n' "$backup"

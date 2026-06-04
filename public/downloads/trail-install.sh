#!/usr/bin/env bash
set -euo pipefail
TRAIL_REPO="https://github.com/taisrisk/Trail.git"
TRAIL_DIR="$HOME/Trail"
TRAIL_HOME="$HOME/.trail"

command -v git >/dev/null || { echo "Install git first."; exit 1; }
command -v node >/dev/null || { echo "Install Node.js LTS first."; exit 1; }

mkdir -p "$TRAIL_HOME"/{config,keys,vault,mail,attachments,index,graph,watchers,calendar,orders,queues,backups,logs,drafts,contacts}

if [ -d "$TRAIL_DIR/.git" ]; then
  cd "$TRAIL_DIR"
  git pull --ff-only
else
  [ -e "$TRAIL_DIR" ] && mv "$TRAIL_DIR" "$TRAIL_DIR-backup-$(date +%s)"
  git clone "$TRAIL_REPO" "$TRAIL_DIR"
  cd "$TRAIL_DIR"
fi

npm install
npm run build

printf '\nTrail installed.\nApp: http://localhost:3000\nMail: http://localhost:3000/mail\nDashboard: http://localhost:3000/dashboard\n\n'
(npm run trail:node &)
npm run dev

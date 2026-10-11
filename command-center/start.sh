#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null || { echo "Cần cài Node.js 20+: https://nodejs.org"; exit 1; }
[ -f .env.local ] || cp .env.local.example .env.local
(sleep 1.5; URL=$(cat data/.url 2>/dev/null); [ -n "$URL" ] && { command -v xdg-open >/dev/null && xdg-open "$URL" || command -v open >/dev/null && open "$URL"; }) >/dev/null 2>&1 &
exec node server.mjs

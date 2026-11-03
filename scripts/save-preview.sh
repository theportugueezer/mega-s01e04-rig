#!/bin/sh
# Save one rig page as a single HTML file, through the running app (a command, not a
# browser's "save as"; the page is self-contained, ADR 0001). Previews go to var/, never
# into the repo (ADR 0003).
#
#   scripts/save-preview.sh [night] [out]          # with the marker from .env
#   LANE_MARKER= scripts/save-preview.sh [night]   # marker unset: banner reads "no marker set"
set -eu
night=${1:-2026-10-28}
out=${2:-var/preview/index.html}
port=${PREVIEW_PORT:-8797}
mkdir -p "$(dirname "$out")"
PORT=$port node_modules/.bin/tsx --env-file-if-exists=.env src/server.ts >/dev/null 2>&1 &
pid=$!
trap 'kill $pid 2>/dev/null' EXIT
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  curl -fsS "http://localhost:$port/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -fsS "http://localhost:$port/digest/$night" > "$out"
echo "saved /digest/$night -> $out ($(wc -c < "$out" | tr -d ' ') bytes)"
grep -o '<span class="marker">[^<]*</span>' "$out"

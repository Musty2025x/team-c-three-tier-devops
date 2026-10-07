#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost/api/health}"

echo "Checking ${URL}"
curl --fail --silent --show-error --max-time 10 "$URL" >/tmp/team-c-health.json
cat /tmp/team-c-health.json
echo
echo "Health check passed."

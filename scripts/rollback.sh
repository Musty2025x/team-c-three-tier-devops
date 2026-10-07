#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/team-c}"
RELEASE_DIR="${APP_DIR}/releases"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
ENV_FILE="${APP_DIR}/.env"

LAST_GOOD="$(ls -1t "${RELEASE_DIR}"/*.env 2>/dev/null | head -n 1 || true)"

if [[ -z "${LAST_GOOD}" ]]; then
  echo "No previous release found."
  exit 1
fi

cp "${LAST_GOOD}" "${ENV_FILE}"

cd "${APP_DIR}"
set -a
source "${ENV_FILE}"
set +a

echo "Rolling back to $(basename "${LAST_GOOD}")"
docker compose -f "${COMPOSE_FILE}" pull backend frontend
docker compose -f "${COMPOSE_FILE}" up -d

./scripts/health-check.sh

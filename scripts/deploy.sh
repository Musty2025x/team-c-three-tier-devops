#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/team-c}"
RELEASE_DIR="${APP_DIR}/releases"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
ENV_FILE="${APP_DIR}/.env"

mkdir -p "${RELEASE_DIR}"

cd "${APP_DIR}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source "${ENV_FILE}"
  set +a
fi

echo "Pulling application images..."
docker compose -f "${COMPOSE_FILE}" pull backend frontend

echo "Starting release..."
docker compose -f "${COMPOSE_FILE}" up -d

echo "Current deployment:"
docker compose -f "${COMPOSE_FILE}" ps

echo "Waiting for API..."
for i in {1..30}; do
  if curl -fsS http://127.0.0.1/api/health >/dev/null; then
    echo "Deployment healthy."
    exit 0
  fi
  sleep 2
done

echo "Deployment failed health check."
docker compose -f "${COMPOSE_FILE}" logs --tail=100 backend
exit 1

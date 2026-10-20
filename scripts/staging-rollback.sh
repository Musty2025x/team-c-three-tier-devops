
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/team-c"
PROJECT="team-c-staging"
STATE_FILE="${APP_DIR}/staging-known-good-tag"

if [[ ! -s "$STATE_FILE" ]]; then
  echo "ERROR: No known-good staging release recorded."
  exit 1
fi

GOOD_TAG="$(cat "$STATE_FILE")"

if [[ ! "$GOOD_TAG" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$ ]]; then
  echo "ERROR: Invalid known-good image tag."
  exit 1
fi

RELEASE_DIR="${APP_DIR}/releases/${GOOD_TAG}"
COMPOSE_FILE="${RELEASE_DIR}/docker-compose.yml"
ENV_FILE="${RELEASE_DIR}/.env"

for file in "$COMPOSE_FILE" "$ENV_FILE" \
            "${RELEASE_DIR}/nginx.conf" \
            "${RELEASE_DIR}/monitoring/prometheus/prometheus.yml" \
            "${RELEASE_DIR}/monitoring/prometheus/alerts.yml" \
            "${RELEASE_DIR}/monitoring/alertmanager/alertmanager.yml"; do
  if [[ ! -f "$file" ]]; then
    echo "ERROR: Required known-good release file missing: $file"
    exit 1
  fi
done

echo "Rolling staging back to: $GOOD_TAG"

cd "$RELEASE_DIR"

docker compose \
  -p "$PROJECT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" config -q

docker compose \
  -p "$PROJECT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" pull backend frontend

docker compose \
  -p "$PROJECT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" up -d

for attempt in $(seq 1 12); do
  if curl --fail --silent --show-error \
      --max-time 5 http://localhost/api/health; then
    echo
    echo "ROLLBACK SUCCESS: $GOOD_TAG is healthy."
    exit 0
  fi

  echo "Waiting for application recovery ($attempt/12)..."
  sleep 5
done

echo "ROLLBACK FAILED: staging did not recover."
docker compose \
  -p "$PROJECT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" ps -a || true

docker compose \
  -p "$PROJECT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" logs --tail=80 backend frontend nginx || true

exit 1


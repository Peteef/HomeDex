#!/usr/bin/env bash
# Smoke test of a built HomeDex image: starts it with a throwaway data volume, waits for the
# HEALTHCHECK, creates a fake user through the CLI, then checks the API, the UI and a login.
# Usage: tests/docker/smoke.sh [image]   (default: homedex:local)
set -euo pipefail

readonly IMAGE="${1:-homedex:local}"
readonly NAME="homedex-smoke-$$"
readonly VOLUME="${NAME}-data"
readonly CONTAINER_PORT=3000
readonly HEALTH_TIMEOUT_SECONDS=60
readonly CLI=src/platform/backend/infrastructure/cli/users.ts
readonly USERNAME=smoke-tester
readonly PASSWORD=not-a-real-password

cleanup() {
  docker rm --force "$NAME" >/dev/null 2>&1 || true
  docker volume rm "$VOLUME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

fail() {
  echo "FAIL: $1" >&2
  docker logs "$NAME" >&2 || true
  exit 1
}

pass() {
  echo "ok - $1"
}

docker run --detach --name "$NAME" --volume "$VOLUME:/data" \
  --publish "127.0.0.1::$CONTAINER_PORT" "$IMAGE" >/dev/null
base_url="http://$(docker port "$NAME" "$CONTAINER_PORT" | head -n 1)"

status=starting
for ((elapsed = 0; elapsed < HEALTH_TIMEOUT_SECONDS; elapsed++)); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$NAME")"
  if [[ "$status" == healthy ]]; then
    break
  fi
  sleep 1
done
[[ "$status" == healthy ]] || fail "container is '$status' after ${HEALTH_TIMEOUT_SECONDS}s"
pass "HEALTHCHECK reports healthy"

[[ "$(docker exec "$NAME" id -u)" != 0 ]] || fail "the server runs as root"
pass "runs as a non-root user"

docker exec "$NAME" test -f /data/homedex.db || fail "no database in the /data volume"
pass "database is created in the /data volume"

for forbidden in /app/.env /app/data /app/e2e /app/tests; do
  docker exec "$NAME" test ! -e "$forbidden" || fail "$forbidden is in the image"
done
[[ -z "$(docker exec "$NAME" find /app/src -name __tests__)" ]] || fail "unit tests are in the image"
pass "no .env, data or tests in the image"

printf '%s' "$PASSWORD" | docker exec --interactive "$NAME" node "$CLI" create "$USERNAME" >/dev/null ||
  fail "users CLI could not create an account"
pass "users CLI creates an account"

[[ "$(curl --silent --fail "$base_url/api/health")" == '{"status":"ok"}' ]] ||
  fail "GET /api/health"
pass "GET /api/health"

curl --silent --fail "$base_url/" | grep --quiet '<div id="root">' || fail "GET / does not serve the UI"
pass "GET / serves the UI"

login_status="$(curl --silent --output /dev/null --write-out '%{http_code}' \
  --header 'Content-Type: application/json' \
  --data "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  "$base_url/api/auth/login")"
[[ "$login_status" == 200 ]] || fail "POST /api/auth/login answered $login_status"
pass "POST /api/auth/login"

echo "Smoke test passed for $IMAGE"
